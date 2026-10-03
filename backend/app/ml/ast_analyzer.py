import ast
import re
import math
from typing import Dict, Any, List, Set, Optional
from app.ml.features import calculate_shannon_entropy, compute_sha256, score_to_color_and_verdict
from app.api.schemas import CodeAnalysisMetrics, CodeLineSpan, CodeAnalysisResponse

class CodeAstAnalyzer:
    """
    Forensic static analyzer for source code to detect AI-generated patterns
    via AST depth distribution, identifier naming entropy, and structural metrics.
    Supports Python, JavaScript, TypeScript, Java, C++, and Go.
    """

    @classmethod
    def analyze_code(cls, code: str, language: str = "python") -> CodeAnalysisResponse:
        lang = language.lower().strip()
        if lang in ["python", "py"]:
            return cls.analyze_python_code(code)
        else:
            return cls.analyze_generic_code(code, lang)

    @classmethod
    def analyze_python_code(cls, code: str) -> CodeAnalysisResponse:
        lines = code.splitlines()
        loc_count = len(lines)
        forensic_hash = compute_sha256(code)
        
        identifiers: List[str] = []
        max_depth = 0
        branches = 0
        comment_lines = 0

        # Count comments and basic metrics
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("#"):
                comment_lines += 1

        comment_density = round((comment_lines / max(1, loc_count)) * 100, 2)

        try:
            tree = ast.parse(code)
            
            # Compute AST Max Depth & Branching (Cyclomatic Complexity proxy)
            def walk_ast(node: ast.AST, current_depth: int = 1) -> int:
                nonlocal branches
                m_depth = current_depth
                
                # Check for control flow nodes
                if isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.ExceptHandler, ast.With)):
                    branches += 1
                
                # Collect variable/function names
                if isinstance(node, ast.Name):
                    identifiers.append(node.id)
                elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    identifiers.append(node.name)
                elif isinstance(node, ast.arg):
                    identifiers.append(node.arg)

                for child in ast.iter_child_nodes(node):
                    child_depth = walk_ast(child, current_depth + 1)
                    if child_depth > m_depth:
                        m_depth = child_depth
                return m_depth

            max_depth = walk_ast(tree)

        except SyntaxError:
            # If code is a snippet or has minor syntax errors, compute line-based fallback
            max_depth = 3
            branches = sum(1 for line in lines if any(k in line for k in ["if ", "for ", "while ", "def ", "try:"]))

        return cls._score_and_build_response(lines, identifiers, max_depth, branches, comment_density, loc_count, forensic_hash, "python")

    @classmethod
    def analyze_generic_code(cls, code: str, language: str) -> CodeAnalysisResponse:
        """
        Lexical and bracket-nesting AST analyzer for JS/TS, Java, C++, Go, and C#.
        """
        lines = code.splitlines()
        loc_count = len(lines)
        forensic_hash = compute_sha256(code)

        comment_lines = 0
        current_depth = 0
        max_depth = 0
        branches = 0
        identifiers: List[str] = []

        # Identifier extraction pattern
        id_pattern = re.compile(r'\b([a-zA-Z_$][a-zA-Z0-9_$]{1,30})\b')
        reserved_keywords = {
            "const", "let", "var", "function", "return", "class", "import", "export",
            "from", "default", "if", "else", "for", "while", "do", "switch", "case",
            "break", "continue", "try", "catch", "finally", "throw", "new", "this",
            "public", "private", "protected", "static", "void", "int", "float", "double",
            "string", "boolean", "package", "func", "struct", "interface", "type"
        }

        for line in lines:
            stripped = line.strip()
            # Comments
            if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
                comment_lines += 1

            # Track nesting depth via braces
            open_braces = line.count("{") - line.count("}")
            current_depth = max(0, current_depth + open_braces)
            if current_depth > max_depth:
                max_depth = current_depth

            # Control flow branching
            if any(re.search(rf'\b{kw}\b', stripped) for kw in ["if", "for", "while", "switch", "catch"]):
                branches += 1

            # Extract identifier tokens
            for match in id_pattern.finditer(line):
                token = match.group(1)
                if token.lower() not in reserved_keywords:
                    identifiers.append(token)

        comment_density = round((comment_lines / max(1, loc_count)) * 100, 2)
        max_depth = max(2, max_depth)

        return cls._score_and_build_response(lines, identifiers, max_depth, branches, comment_density, loc_count, forensic_hash, language)

    @classmethod
    def _score_and_build_response(
        cls, lines: List[str], identifiers: List[str], max_depth: int,
        branches: int, comment_density: float, loc_count: int,
        forensic_hash: str, language: str
    ) -> CodeAnalysisResponse:
        # Calculate identifier Shannon entropy
        combined_ids = "".join(identifiers) if identifiers else "".join(lines)
        id_entropy = calculate_shannon_entropy(combined_ids)

        # AI-generated code characteristics
        textbook_names = {"result", "data", "temp", "val", "value", "item", "items", "output", "res", "arr", "lst", "response", "element"}
        textbook_count = sum(1 for name in identifiers if name.lower() in textbook_names)
        textbook_ratio = textbook_count / max(1, len(identifiers))

        ai_score_raw = 30.0
        if textbook_ratio > 0.35:
            ai_score_raw += 30.0
        elif textbook_ratio > 0.20:
            ai_score_raw += 15.0

        if 3 <= max_depth <= 6 and branches <= 5:
            ai_score_raw += 15.0
        elif max_depth > 9:
            ai_score_raw -= 20.0

        if comment_density > 25.0:
            ai_score_raw += 20.0
        elif comment_density == 0.0 and loc_count > 15:
            ai_score_raw -= 10.0

        overall_ai_score = max(5.0, min(95.0, round(ai_score_raw, 1)))
        _, verdict_label, _ = score_to_color_and_verdict(overall_ai_score / 100.0)

        # Construct line-by-line spans for Monaco code editor
        line_spans: List[CodeLineSpan] = []
        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            line_score = overall_ai_score / 100.0

            # Differentiate line classification
            if stripped.startswith("#") or stripped.startswith("//"):
                lower_c = stripped.lower()
                if any(w in lower_c for w in ["step", "initialize", "helper", "calculate", "function to", "loop through", "create", "return the"]):
                    line_score = min(0.92, max(0.75, line_score + 0.25))
                elif any(w in lower_c for w in ["hack", "todo", "fixme", "workaround", "ugly", "debug", "wip", "legacy"]):
                    line_score = max(0.12, min(0.30, line_score - 0.35))
                else:
                    line_score = min(0.85, line_score + 0.15)
            elif any(stripped.startswith(k) for k in [
                "result =", "data =", "total =", "output =", "res =", "temp =", "val =",
                "const result", "let result", "const data", "let total", "var temp"
            ]):
                line_score = min(0.88, max(0.72, line_score + 0.20))
            elif any(k in stripped for k in ["_hack", "fix_", "dbg_", "crazy", "weird", "lambda", "assert ", "console.log", "print("]):
                line_score = max(0.15, line_score - 0.28)
            elif any(k in stripped for k in ["def ", "class ", "function ", "return ", "export "]):
                line_score = max(0.38, min(0.62, line_score))

            line_score = max(0.05, min(0.95, line_score))
            verdict_type, _, color = score_to_color_and_verdict(line_score)
            line_spans.append(CodeLineSpan(
                line_number=idx,
                code=line,
                ai_probability=round(line_score * 100.0, 1),
                classification=verdict_type,
                highlight_color=color
            ))

        metrics = CodeAnalysisMetrics(
            overall_ai_score=overall_ai_score,
            verdict=verdict_label,
            ast_max_depth=max_depth,
            identifier_entropy=id_entropy,
            cyclomatic_complexity=branches + 1,
            comment_density_pct=comment_density,
            loc_count=loc_count,
            forensic_hash=forensic_hash
        )

        return CodeAnalysisResponse(
            status="success",
            metrics=metrics,
            lines=line_spans
        )
