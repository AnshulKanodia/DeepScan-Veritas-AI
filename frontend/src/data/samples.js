export const SAMPLE_TEXTS = {
  aiEssay: `In today's rapidly evolving technological landscape, artificial intelligence represents a paradigm shift that is reshaping industries across the globe. From healthcare diagnostics to autonomous transportation, machine learning algorithms are unlocking unprecedented efficiencies. Moreover, it is crucial to recognize that the ethical implications of these advancements underscore the necessity of robust governance frameworks. As society navigates this transformative epoch, collaborative endeavors between policymakers and technologists will remain paramount to fostering responsible innovation and sustainable growth.`,
  
  humanEssay: `I started looking into this late last night after my third cup of burnt filter coffee. Honestly? Most of what people call revolutionary is just glorified spreadsheet math wrapped in slick pitch decks. When you dig past the investor buzzwords, you find fragile pipelines held together with duct tape and hope. Maybe that's cynical, but spend three weeks debugging edge cases in legacy production, and tell me if you still believe in seamless technological utopias.`
};

export const SAMPLE_CODES = {
  aiCode: `def calculate_average_scores(student_records):
    # Calculate the average score for each student in the records dictionary
    result = {}
    for student, scores in student_records.items():
        total = sum(scores)
        count = len(scores)
        # Avoid division by zero
        if count > 0:
            result[student] = total / count
        else:
            result[student] = 0.0
    return result`,

  humanCode: `def _prune_dangling_nodes(graph_adj, root_id, max_depth=12):
    visited, q = set(), [(root_id, 0)]
    while q:
        curr, d = q.pop()
        if d >= max_depth or curr in visited: 
            continue
        visited.add(curr)
        for nxt in graph_adj.get(curr, ()):
            if nxt not in visited:
                q.append((nxt, d + 1))
    return {k: v for k, v in graph_adj.items() if k in visited}`
};
