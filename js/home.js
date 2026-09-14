// Homepage: render live stats and a revisit-flagged preview list,
// both pulled from the actual stored data — nothing here is hardcoded.
document.addEventListener("DOMContentLoaded", () => {
  const topics = AnteikuStore.getTopics();
  const problems = AnteikuStore.getProblems();

  const revisitList = document.getElementById("revisit-preview");
  const flagged = problems.filter((p) => p.revisit);

  if (flagged.length === 0) {
    revisitList.innerHTML = `<li class="empty-state">Nothing flagged to revisit right now — nice.</li>`;
    return;
  }

  flagged.slice(0, 5).forEach((problem) => {
    const li = document.createElement("li");
    const topicName = AnteikuStore.topicNameById(topics, problem.topic);
    li.innerHTML = `
      <span>${escapeHtml(problem.name)}</span>
      <span class="tag-chip">${escapeHtml(topicName)}</span>
    `;
    revisitList.appendChild(li);
  });
});

// Minimal HTML escaping for user-entered text rendered via innerHTML.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
