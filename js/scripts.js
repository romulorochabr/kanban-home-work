/*
Flexboard JS starter: practice DOM manipulation.
Features implemented:
- Add task (default column: todo)
- Move task between columns (buttons)
- Mark complete (move to done)
- Edit & delete (inline edit)
- Filters (all/todo/done) client-side
- Persist to localStorage
- Event delegation pattern (single listener on board)
*/

const storageKey = "flexboard.tasks.v1";
const board = document.getElementById("board");
const colBodies = {
  todo: document.getElementById("col-todo"),
  inprogress: document.getElementById("col-inprogress"),
  done: document.getElementById("col-done"),
};
const counts = {
  todo: document.getElementById("count-todo"),
  inprogress: document.getElementById("count-inprogress"),
  done: document.getElementById("count-done"),
};
const addBtn = document.getElementById("addBtn");
const textInput = document.getElementById("taskText");
const clearBtn = document.getElementById("clearBtn");
const seedBtn = document.getElementById("seedBtn");
const filterChips = document.querySelectorAll(".chip");

let tasks = loadTasks(); // array of {id,title,desc,column,created}

// ----------------- util -----------------
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
  updateCounts();
}
function loadTasks() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function createCardDOM(task) {
  const el = document.createElement("article");
  el.className = "card" + (task.column === "done" ? " completed" : "");
  el.setAttribute("data-id", task.id);
  el.innerHTML = `
<input type="checkbox" class="icon-btn chk" aria-label="Mark complete" ${
    task.column === "done" ? "checked" : ""
  }>
<div class="meta">
<p class="title" tabindex="0">${escapeHtml(task.title)}</p>
<p class="desc">${escapeHtml(task.desc || "")}</p>
<small style="color:var(--muted)">${new Date(
    task.created
  ).toLocaleString()}</small>
</div>
<div class="actions" role="group" aria-label="card actions">
<button class="icon-btn move-left" title="Move left">◀</button>
<button class="icon-btn edit" title="Edit">✎</button>
<button class="icon-btn del" title="Delete" aria-label="Delete task">🗑</button>
<button class="icon-btn move-right" title="Move right">▶</button>
</div>
`;
  return el;
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
  );
}

// ----------------- render -----------------
function renderBoard(filter = "all") {
  // clear columns
  Object.values(colBodies).forEach((c) => (c.innerHTML = ""));
  tasks.forEach((t) => {
    if (
      filter === "all" ||
      (filter === "todo" && t.column !== "done") ||
      (filter === "done" && t.column === "done")
    ) {
      colBodies[t.column].appendChild(createCardDOM(t));
    }
  });
  updateCounts();
}
function updateCounts() {
  counts.todo.textContent = tasks.filter((t) => t.column === "todo").length;
  counts.inprogress.textContent = tasks.filter(
    (t) => t.column === "inprogress"
  ).length;
  counts.done.textContent = tasks.filter((t) => t.column === "done").length;
}

// ----------------- actions -----------------
addBtn.addEventListener("click", () => {
  const val = textInput.value.trim();
  if (!val) return textInput.focus();
  const newTask = {
    id: uid(),
    title: val,
    desc: "",
    column: "todo",
    created: Date.now(),
  };
  tasks.unshift(newTask);
  saveTasks();
  textInput.value = "";
  renderBoard(getActiveFilter());
});

textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addBtn.click();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("Clear all tasks?")) return;
  tasks = [];
  saveTasks();
  renderBoard(getActiveFilter());
});

seedBtn.addEventListener("click", () => {
  const examples = [
    {
      id: uid(),
      title: "Remove old shower taps",
      desc: "Prepare the wall and cap pipes",
      column: "todo",
      created: Date.now() - 1000 * 60 * 60,
    },
    {
      id: uid(),
      title: "Order Villaboard sheets",
      desc: "3 sheets 1200x3600",
      column: "inprogress",
      created: Date.now() - 1000 * 60 * 30,
    },
    {
      id: uid(),
      title: "Tile shower floor",
      desc: "Use 600x600 grid, slope 1:80",
      column: "done",
      created: Date.now() - 1000 * 60 * 60 * 8,
    },
  ];
  tasks = examples.concat(tasks);
  saveTasks();
  renderBoard(getActiveFilter());
});

// Event delegation for card actions
board.addEventListener("click", (ev) => {
  const card = ev.target.closest(".card");
  if (!card) return;
  const id = card.getAttribute("data-id");
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  if (ev.target.matches(".del")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderBoard(getActiveFilter());
    return;
  }
  if (ev.target.matches(".edit")) {
    const newTitle = prompt("Edit task title", task.title);
    if (newTitle !== null) {
      task.title = newTitle.trim();
      saveTasks();
      renderBoard(getActiveFilter());
    }
    return;
  }
  if (ev.target.matches(".move-left")) {
    task.column = moveLeft(task.column);
    saveTasks();
    renderBoard(getActiveFilter());
    return;
  }
  if (ev.target.matches(".move-right")) {
    task.column = moveRight(task.column);
    saveTasks();
    renderBoard(getActiveFilter());
    return;
  }
  if (ev.target.matches(".chk")) {
    // toggle done
    task.column = task.column === "done" ? "todo" : "done";
    saveTasks();
    renderBoard(getActiveFilter());
    return;
  }
});

// keyboard accessibility: allow Enter to edit title when focused
board.addEventListener("keydown", (ev) => {
  if (ev.target.classList.contains("title") && ev.key === "Enter") {
    ev.preventDefault();
    ev.target.closest(".card").querySelector(".edit").click();
  }
});

// filters
filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    renderBoard(getActiveFilter());
  });
});
function getActiveFilter() {
  return document.querySelector(".chip.active").dataset.filter || "all";
}

// helpers to move columns
function moveLeft(col) {
  if (col === "inprogress") return "todo";
  if (col === "done") return "inprogress";
  return "todo";
}
function moveRight(col) {
  if (col === "todo") return "inprogress";
  if (col === "inprogress") return "done";
  return "done";
}

// initial render
renderBoard();
