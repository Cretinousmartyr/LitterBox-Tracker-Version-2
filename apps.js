// Global array to store our litter boxes.
window.boxes = [];

// Initialize boxes on DOM load.
document.addEventListener("DOMContentLoaded", () => {
  window.boxes = loadBoxes();
  renderBoxes(window.boxes);
});

/**
 * Loads boxes from localStorage (if available) or creates the default boxes.
 */
function loadBoxes() {
  const data = localStorage.getItem("litterBoxes");
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing stored data:", e);
    }
  }
  // Default litter box names.
  const defaultNames = [
    "My Bedroom Litter Box",
    "Living Room Litter Box",
    "Under Garbage Can Litter Box",
    "Undertable Litter Box",
    "Laundry Room Litter Box",
    "Parents' Bedroom Litter Box",
  ];
  const boxes = defaultNames.map((name, index) => ({
    id: index,
    name: name,
    events: []
  }));
  localStorage.setItem("litterBoxes", JSON.stringify(boxes));
  return boxes;
}

/**
 * Saves the complete boxes array to localStorage.
 */
function saveBoxes(boxes) {
  localStorage.setItem("litterBoxes", JSON.stringify(boxes));
}

/**
 * Renders all litter boxes into the #boxes-container element.
 */
function renderBoxes(boxes) {
  const container = document.getElementById("boxes-container");
  container.innerHTML = "";
  boxes.forEach((box) => {
    container.appendChild(createBoxElement(box));
  });
}

/**
 * Creates and returns a DOM element representing a single litter box.
 */
function createBoxElement(box) {
  const boxDiv = document.createElement("div");
  boxDiv.className = "box";
  boxDiv.dataset.boxId = box.id;

  // Header with editable title.
  const header = document.createElement("div");
  header.className = "box-header";
  const title = createTitleElement(box);
  header.appendChild(title);
  boxDiv.appendChild(header);

  // Summary section: recent events and toggle for full log.
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "box-summary";
  
  // Recent events summary.
  const lastEvents = document.createElement("div");
  lastEvents.className = "last-events";
  updateEventSummary(box, lastEvents);
  summaryDiv.appendChild(lastEvents);
  
  // Toggle button for the full event log.
  const toggleLink = document.createElement("button");
  toggleLink.className = "toggle-log";
  toggleLink.type = "button";
  toggleLink.textContent = "Show Full Log";
  summaryDiv.appendChild(toggleLink);
  
  // Full log container (initially hidden).
  const fullLogDiv = document.createElement("div");
  fullLogDiv.className = "full-log hidden";
  updateFullLog(box, fullLogDiv);
  summaryDiv.appendChild(fullLogDiv);
  
  // Toggle functionality for full log display.
  toggleLink.addEventListener("click", () => {
    if (fullLogDiv.classList.contains("hidden")) {
      fullLogDiv.classList.remove("hidden");
      toggleLink.textContent = "Hide Full Log";
    } else {
      fullLogDiv.classList.add("hidden");
      toggleLink.textContent = "Show Full Log";
    }
  });
  
  boxDiv.appendChild(summaryDiv);

  // Controls for logging events.
  const controlsDiv = document.createElement("div");
  controlsDiv.className = "box-controls";
  
  const scoopedBtn = document.createElement("button");
  scoopedBtn.className = "btn scooped";
  scoopedBtn.type = "button";
  scoopedBtn.textContent = "Scooped";
  scoopedBtn.addEventListener("click", () => {
    addEventToBox(box, "Scooped");
  });
  controlsDiv.appendChild(scoopedBtn);

  const cleanedBtn = document.createElement("button");
  cleanedBtn.className = "btn cleaned";
  cleanedBtn.type = "button";
  cleanedBtn.textContent = "Cleaned";
  cleanedBtn.addEventListener("click", () => {
    // Clicking "Cleaned" logs both a "Cleaned" event and a "Scooped" event (with the same timestamp).
    addEventToBox(box, "Cleaned", true);
  });
  controlsDiv.appendChild(cleanedBtn);

  boxDiv.appendChild(controlsDiv);

  // Notification schedule display.
  const notificationsDiv = document.createElement("div");
  notificationsDiv.className = "notifications";
  updateNotificationsDiv(box, notificationsDiv);
  boxDiv.appendChild(notificationsDiv);

  return boxDiv;
}

/**
 * Creates a clickable title element that can be edited to rename the box.
 */
function createTitleElement(box) {
  const title = document.createElement("h2");
  title.className = "box-title";
  title.textContent = box.name;
  title.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = box.name;
    input.addEventListener("blur", () => {
      box.name = input.value || box.name;
      saveAndUpdateBox(box);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        input.blur();
      }
    });
    title.replaceWith(input);
    input.focus();
  });
  return title;
}

/**
 * Saves box updates (such as renaming) and refreshes the title.
 */
function saveAndUpdateBox(box) {
  const boxDiv = document.querySelector(`.box[data-box-id="${box.id}"]`);
  if (!boxDiv) return;
  const existingInput = boxDiv.querySelector("input");
  if (existingInput) {
    const newTitle = createTitleElement(box);
    boxDiv.querySelector(".box-header").replaceChild(newTitle, existingInput);
  }
  updateLocalStorageForBox(box);
}

/**
 * Adds an event (Scooped or Cleaned) to a box.
 * For "Cleaned", if addExtraScooped is true, logs both events with the same timestamp.
 */
function addEventToBox(box, eventType, addExtraScooped = false) {
  const timestamp = new Date().toISOString();
  if (eventType === "Cleaned" && addExtraScooped) {
    box.events.push({ type: "Cleaned", timestamp });
    box.events.push({ type: "Scooped", timestamp });
  } else {
    box.events.push({ type: eventType, timestamp });
  }
  updateBoxUI(box);
  updateLocalStorageForBox(box);
}

/**
 * Updates the events summary, full log, and notifications for a given box.
 */
function updateBoxUI(box) {
  const boxDiv = document.querySelector(`.box[data-box-id="${box.id}"]`);
  if (!boxDiv) return;
  
  // Update event summary and full log.
  const lastEvents = boxDiv.querySelector(".last-events");
  updateEventSummary(box, lastEvents);
  const fullLogDiv = boxDiv.querySelector(".full-log");
  updateFullLog(box, fullLogDiv);
  
  // Update notifications.
  const notificationsDiv = boxDiv.querySelector(".notifications");
  updateNotificationsDiv(box, notificationsDiv);
}

/**
 * Updates the summary area to show the last "Scooped" and "Cleaned" events.
 */
function updateEventSummary(box, summaryDiv) {
  const scoopedEvents = box.events.filter(e => e.type === "Scooped");
  const cleanedEvents = box.events.filter(e => e.type === "Cleaned");

  const lastScooped = scoopedEvents.length > 0 ? 
    new Date(scoopedEvents[scoopedEvents.length - 1].timestamp).toLocaleString() : "N/A";
  const lastCleaned = cleanedEvents.length > 0 ? 
    new Date(cleanedEvents[cleanedEvents.length - 1].timestamp).toLocaleString() : "N/A";
  
  summaryDiv.innerHTML = `
    <div><strong>Last Scooped:</strong> ${lastScooped}</div>
    <div><strong>Last Cleaned:</strong> ${lastCleaned}</div>
  `;
}

/**
 * Updates the full log area with all events (most recent first).
 */
function updateFullLog(box, fullLogDiv) {
  fullLogDiv.innerHTML = "";
  if (box.events.length === 0) {
    fullLogDiv.textContent = "No events logged yet.";
    return;
  }
  box.events.slice().reverse().forEach(event => {
    const eventDiv = document.createElement("div");
    eventDiv.textContent = `${event.type} at ${new Date(event.timestamp).toLocaleString()}`;
    fullLogDiv.appendChild(eventDiv);
  });
}

/**
 * Updates the notification schedule based on the last scooped and cleaned events.
 */
function updateNotificationsDiv(box, notificationsDiv) {
  const scoopEvents = box.events.filter(e => e.type === "Scooped");
  const cleanedEvents = box.events.filter(e => e.type === "Cleaned");

  let nextScoopedTime = "N/A";
  let nextCleanedTime = "N/A";

  if (scoopEvents.length > 0) {
    const lastScooped = new Date(scoopEvents[scoopEvents.length - 1].timestamp);
    const nextScooped = new Date(lastScooped.getTime() + 48 * 60 * 60 * 1000);
    nextScoopedTime = nextScooped.toLocaleString();
  }
  if (cleanedEvents.length > 0) {
    const lastCleaned = new Date(cleanedEvents[cleanedEvents.length - 1].timestamp);
    const nextCleaned = new Date(lastCleaned.getTime() + 21 * 24 * 60 * 60 * 1000);
    nextCleanedTime = nextCleaned.toLocaleString();
  }

  notificationsDiv.innerHTML = `
    <div><strong>Next scoop notification:</strong> ${nextScoopedTime}</div>
    <div><strong>Next cleaned notification:</strong> ${nextCleanedTime}</div>
  `;
}

/**
 * Updates localStorage for the modified box by saving the entire boxes array.
 */
function updateLocalStorageForBox(box) {
  const index = window.boxes.findIndex(b => b.id === box.id);
  if (index !== -1) {
    window.boxes[index] = box;
    saveBoxes(window.boxes);
  }
}
