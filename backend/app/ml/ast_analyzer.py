import ast
import math
from typing import Dict, Any, List, Set
from backend.app.ml.features import calculate_shannon_entropy, compute_sha256, score_to_color_and_verdict
from backend.app.api.schemas import CodeAnalysisMetrics, CodeLineSpan, CodeAnalysisResponse

class CodeAstAnalyzer:
    """
    Forensic static analyzer for source code to detect AI-generated patterns
    via AST depth distribution, identifier naming entropy, and structural metrics.
    """

    @staticmethod
    def analyze_python_code(code: str) -> CodeAnalysisResponse:
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

        # Calculate identifier Shannon entropy
        combined_ids = "".join(identifiers) if identifiers else code
        id_entropy = calculate_shannon_entropy(combined_ids)

        # AI-generated code characteristics:
        # 1. Extremely standard, textbook identifier names (moderate-to-low entropy, e.g. 'result', 'total', 'item')
        # 2. Perfect, uniform indentation and standard AST depth (typically 3 to 6)
        # 3. High boilerplate-to-logic ratio
        # 4. Canonical variable names like 'data', 'temp', 'res', 'item', 'value'
        textbook_names = {"result", "data", "temp", "val", "value", "item", "items", "output", "res", "arr", "lst"}
        textbook_count = sum(1 for name in identifiers if name.lower() in textbook_names)
        textbook_ratio = textbook_count / max(1, len(identifiers))

        # Heuristic scoring calibrated with common LLM code output
        ai_score_raw = 30.0
        if textbook_ratio > 0.35:
            ai_score_raw += 30.0
        elif textbook_ratio > 0.20:
            ai_score_raw += 15.0

        if 3 <= max_depth <= 6 and branches <= 5:
            ai_score_raw += 15.0
        elif max_depth > 9:
            ai_score_raw -= 20.0  # Deep nested logic is typical of messy human code

        if comment_density > 25.0:
            # Overly pedagogical step-by-step comments are an LLM hallmark
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
            
            # Nuance line scoring based on comments or generic assignments
            if stripped.startswith("#"):
                line_score = min(0.95, line_score + 0.15)
            elif any(k in stripped for k in ["def ", "class "]):
                line_score = max(0.10, line_score - 0.10)

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
