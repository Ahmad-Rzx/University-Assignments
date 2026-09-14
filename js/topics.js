// Topics tracker: add / edit / delete topics, each with a 1-5 comfort
// rating and free-form notes. Also shows how many logged problems are
// tagged to each topic, reading from the shared problem log data.
document.addEventListener("DOMContentLoaded", () => {
  let topics = AnteikuStore.getTopics();
  const problems = AnteikuStore.getProblems();

  const grid = document.getElementById("topics-grid");
  const emptyState = document.getElementById("topics-empty");

  const addBtn = document.getElementById("add-topic-btn");
  const formSection = document.getElementById("topic-form-section");
  const form = document.getElementById("topic-form");
  const formHeading = document.getElementById("topic-form-heading");
  const cancelBtn = document.getElementById("topic-cancel-btn");

  const idInput = document.getElementById("topic-id");
  const nameInput = document.getElementById("topic-name");
  const nameGroup = document.getElementById("group-topic-name");
  const nameError = document.getElementById("error-topic-name");
  const comfortInput = document.getElementById("topic-comfort");
  const comfortReadout = document.getElementById("comfort-readout");
  const notesInput = document.getElementById("topic-notes");

  comfortInput.addEventListener("input", () => {
    comfortReadout.textContent = comfortInput.value;
  });

  const openForm = (mode, topic) => {
    formSection.hidden = false;
    nameGroup.classList.remove("has-error");
    nameError.textContent = "";

    if (mode === "edit" && topic) {
      formHeading.textContent = "Edit topic";
      idInput.value = topic.id;
      nameInput.value = topic.name;
      comfortInput.value = topic.comfort;
      comfortReadout.textContent = topic.comfort;
      notesInput.value = topic.notes || "";
    } else {
      formHeading.textContent = "Add a topic";
      idInput.value = "";
      nameInput.value = "";
      comfortInput.value = 3;
      comfortReadout.textContent = "3";
      notesInput.value = "";
    }

    formSection.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInput.focus();
  };

  const closeForm = () => {
    formSection.hidden = true;
    form.reset();
  };

  addBtn.addEventListener("click", () => openForm("add"));
  cancelBtn.addEventListener("click", closeForm);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    if (name.length === 0) {
      nameGroup.classList.add("has-error");
      nameError.textContent = "Please name the topic.";
      nameInput.focus();
      return;
    }

    const editingId = idInput.value;
    const comfort = Number(comfortInput.value);
    const notes = notesInput.value.trim();

    if (editingId) {
      topics = topics.map((t) =>
        t.id === editingId ? { ...t, name, comfort, notes } : t
      );
    } else {
      topics.push({
        id: AnteikuStore.newTopicId(),
        name,
        comfort,
        notes,
      });
    }

    AnteikuStore.saveTopics(topics);
    closeForm();
    render();
  });

  const countLinkedProblems = (topicId) =>
    problems.filter((p) => p.topic === topicId).length;

  const render = () => {
    grid.innerHTML = "";
    emptyState.hidden = topics.length !== 0;

    topics.forEach((topic) => {
      const card = document.createElement("article");
      card.className = "topic-card";

      const dots = Array.from({ length: 5 }, (_, i) =>
        `<span class="comfort-dot ${i < topic.comfort ? "is-filled" : ""}"></span>`
      ).join("");

      const linkedCount = countLinkedProblems(topic.id);

      card.innerHTML = `
        <div class="topic-card-head">
          <h3>${escapeHtml(topic.name)}</h3>
          <div class="comfort-meter" aria-label="Comfort ${topic.comfort} of 5">${dots}</div>
        </div>
        <p class="topic-card-notes">${escapeHtml(topic.notes || "")}</p>
        <span class="topic-card-linked">${linkedCount} logged problem${linkedCount === 1 ? "" : "s"}</span>
        <div class="topic-card-actions">
          <button class="btn btn-ghost btn-small" data-action="edit" data-id="${topic.id}">Edit</button>
          <button class="btn btn-danger btn-small" data-action="delete" data-id="${topic.id}">Delete</button>
        </div>
      `;

      grid.appendChild(card);
    });
  };

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
      const topic = topics.find((t) => t.id === id);
      if (topic) openForm("edit", topic);
    }

    if (action === "delete") {
      const topic = topics.find((t) => t.id === id);
      const confirmed = window.confirm(
        `Delete "${topic ? topic.name : "this topic"}"? This can't be undone.`
      );
      if (!confirmed) return;

      topics = topics.filter((t) => t.id !== id);
      AnteikuStore.saveTopics(topics);
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
