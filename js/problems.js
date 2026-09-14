// Problem Log: add / edit / delete logged problems. Supports live
// search by name, filtering by topic and verdict, and a revisit-only
// toggle — all combinable. The topic dropdown (both the filter and the
// form) is populated from the Topics tracker's data, so the two stay
// linked.
document.addEventListener("DOMContentLoaded", () => {
  const topics = AnteikuStore.getTopics();
  let problems = AnteikuStore.getProblems();

  const tbody = document.getElementById("problems-tbody");
  const emptyState = document.getElementById("problems-empty");

  const searchInput = document.getElementById("problem-search");
  const filterTopic = document.getElementById("filter-topic");
  const filterVerdict = document.getElementById("filter-verdict");
  const filterRevisit = document.getElementById("filter-revisit");

  const addBtn = document.getElementById("add-problem-btn");
  const formSection = document.getElementById("problem-form-section");
  const form = document.getElementById("problem-form");
  const formHeading = document.getElementById("problem-form-heading");
  const cancelBtn = document.getElementById("problem-cancel-btn");

  const idInput = document.getElementById("problem-id");
  const nameInput = document.getElementById("problem-name");
  const nameGroup = document.getElementById("group-problem-name");
  const nameError = document.getElementById("error-problem-name");
  const linkInput = document.getElementById("problem-link");
  const linkError = document.getElementById("error-problem-link");
  const judgeInput = document.getElementById("problem-judge");
  const topicSelect = document.getElementById("problem-topic");
  const topicGroup = document.getElementById("group-problem-topic");
  const topicError = document.getElementById("error-problem-topic");
  const difficultyInput = document.getElementById("problem-difficulty");
  const verdictInput = document.getElementById("problem-verdict");
  const notesInput = document.getElementById("problem-notes");
  const revisitInput = document.getElementById("problem-revisit");

  // ---- Populate topic dropdowns (filter + form) from Topics data ----
  const populateTopicOptions = (selectEl, includeAllOption) => {
    selectEl.innerHTML = "";

    if (includeAllOption) {
      const allOpt = document.createElement("option");
      allOpt.value = "all";
      allOpt.textContent = "All topics";
      selectEl.appendChild(allOpt);
    }

    if (topics.length === 0) {
      const noneOpt = document.createElement("option");
      noneOpt.value = "";
      noneOpt.textContent = "No topics yet — add one first";
      selectEl.appendChild(noneOpt);
      return;
    }

    topics.forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic.id;
      opt.textContent = topic.name;
      selectEl.appendChild(opt);
    });
  };

  populateTopicOptions(filterTopic, true);
  populateTopicOptions(topicSelect, false);

  // ---- Form open/close ----
  const openForm = (mode, problem) => {
    formSection.hidden = false;
    [nameGroup, topicGroup].forEach((g) => g.classList.remove("has-error"));
    nameError.textContent = "";
    topicError.textContent = "";
    linkError.textContent = "";

    if (mode === "edit" && problem) {
      formHeading.textContent = "Edit entry";
      idInput.value = problem.id;
      nameInput.value = problem.name;
      linkInput.value = problem.link || "";
      judgeInput.value = problem.judge;
      topicSelect.value = problem.topic;
      difficultyInput.value = problem.difficulty;
      verdictInput.value = problem.verdict;
      notesInput.value = problem.notes || "";
      revisitInput.checked = Boolean(problem.revisit);
    } else {
      formHeading.textContent = "Log a problem";
      idInput.value = "";
      form.reset();
      if (topics.length > 0) topicSelect.value = topics[0].id;
    }

    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInput.focus();
  };

  const closeForm = () => {
    formSection.hidden = true;
    form.reset();
  };

  addBtn.addEventListener("click", () => {
    if (topics.length === 0) {
      alert("Add a topic first on the Topics page, so you can tag this problem to it.");
      return;
    }
    openForm("add");
  });

  cancelBtn.addEventListener("click", closeForm);

  // ---- Save (add or edit) ----
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    let valid = true;

    const name = nameInput.value.trim();
    if (name.length === 0) {
      nameGroup.classList.add("has-error");
      nameError.textContent = "Please name the problem.";
      valid = false;
    }

    const topicId = topicSelect.value;
    if (!topicId) {
      topicGroup.classList.add("has-error");
      topicError.textContent = "Please choose a topic.";
      valid = false;
    }

    const link = linkInput.value.trim();
    if (link.length > 0) {
      try {
        new URL(link);
      } catch {
        linkError.textContent = "That doesn't look like a valid URL.";
        valid = false;
      }
    }

    if (!valid) return;

    const editingId = idInput.value;
    const entry = {
      id: editingId || AnteikuStore.newProblemId(),
      name,
      link,
      judge: judgeInput.value,
      topic: topicId,
      difficulty: difficultyInput.value,
      verdict: verdictInput.value,
      notes: notesInput.value.trim(),
      revisit: revisitInput.checked,
      date: editingId
        ? problems.find((p) => p.id === editingId)?.date || ""
        : new Date().toISOString().slice(0, 10),
    };

    if (editingId) {
      problems = problems.map((p) => (p.id === editingId ? entry : p));
    } else {
      problems.push(entry);
    }

    AnteikuStore.saveProblems(problems);
    closeForm();
    render();
  });

  // ---- Filtering ----
  const applyFilters = () => {
    const query = searchInput.value.trim().toLowerCase();
    const topicFilter = filterTopic.value;
    const verdictFilter = filterVerdict.value;
    const revisitOnly = filterRevisit.checked;

    return problems.filter((p) => {
      const matchesQuery = query === "" || p.name.toLowerCase().includes(query);
      const matchesTopic = topicFilter === "all" || p.topic === topicFilter;
      const matchesVerdict = verdictFilter === "all" || p.verdict === verdictFilter;
      const matchesRevisit = !revisitOnly || p.revisit;
      return matchesQuery && matchesTopic && matchesVerdict && matchesRevisit;
    });
  };

  [searchInput, filterTopic, filterVerdict, filterRevisit].forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  // ---- Render ----
  const verdictClass = (verdict) => {
    if (verdict === "AC") return "verdict-ac";
    if (verdict === "Unsolved") return "verdict-unsolved";
    return "verdict-wa"; // covers WA and TLE
  };

  const render = () => {
    const visible = applyFilters();
    tbody.innerHTML = "";
    emptyState.hidden = visible.length !== 0;

    visible.forEach((problem) => {
      const tr = document.createElement("tr");
      const topicName = AnteikuStore.topicNameById(topics, problem.topic);

      const nameCell = problem.link
        ? `<a href="${escapeAttr(problem.link)}" target="_blank" rel="noopener">${escapeHtml(problem.name)}</a>`
        : escapeHtml(problem.name);

      tr.innerHTML = `
        <td class="problem-name-cell">${nameCell}</td>
        <td>${escapeHtml(problem.judge)}</td>
        <td><span class="tag-chip">${escapeHtml(topicName)}</span></td>
        <td>${escapeHtml(problem.difficulty)}</td>
        <td><span class="tag-chip ${verdictClass(problem.verdict)}">${escapeHtml(problem.verdict)}</span></td>
        <td>${problem.revisit ? '<span class="revisit-flag">● revisit</span>' : ""}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-small" data-action="edit" data-id="${problem.id}">Edit</button>
            <button class="btn btn-danger btn-small" data-action="delete" data-id="${problem.id}">Delete</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });
  };

  tbody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
      const problem = problems.find((p) => p.id === id);
      if (problem) openForm("edit", problem);
    }

    if (action === "delete") {
      const problem = problems.find((p) => p.id === id);
      const confirmed = window.confirm(
        `Delete "${problem ? problem.name : "this entry"}"? This can't be undone.`
      );
      if (!confirmed) return;

      problems = problems.filter((p) => p.id !== id);
      AnteikuStore.saveProblems(problems);
      render();
    }
  });

  render();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
}
