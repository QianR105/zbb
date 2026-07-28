"use strict";

const ANCHOR = { year: 2026, month: 7, day: 1 };
const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

// 图片中的 2026-07-01 至 2026-08-18；其余七位人员每 49 天重复一次。
const staff = [
  { name: "陶", type: "weekly" },
  {
    name: "杨",
    cycle: ["休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚"]
  },
  {
    name: "李",
    cycle: ["休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休"]
  },
  {
    name: "张",
    cycle: ["休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休"]
  },
  {
    name: "龚",
    cycle: ["早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休"]
  },
  {
    name: "黎",
    cycle: ["休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚"]
  },
  {
    name: "胡",
    cycle: ["晚", "晚", "休", "休", "休", "早", "早", "中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中"]
  },
  {
    name: "孙",
    cycle: ["中+晚", "休", "休", "休", "早+中", "晚", "晚", "休", "休", "休", "早+中", "早", "晚", "休", "休", "休", "早+中", "早", "中+晚", "休", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "早+中", "休", "中+晚", "晚", "休", "休", "中+晚", "休", "中+晚", "晚", "休", "休", "中", "中", "晚", "晚", "休", "休", "休", "早", "早"]
  }
];

const yearInput = document.querySelector("#year-input");
const monthInput = document.querySelector("#month-input");
const table = document.querySelector("#schedule-table");
const tableScroll = document.querySelector(".table-scroll");
const scheduleCrosshair = document.querySelector("#schedule-crosshair");
const mobileSchedule = document.querySelector("#mobile-schedule");
const staffSelect = document.querySelector("#staff-select");
const dateInput = document.querySelector("#date-input");
const queryResult = document.querySelector("#query-result");

let displayedDate = getInitialDate();
let dragStartCell = null;
let dragStartPoint = null;
let didDrag = false;

function getInitialDate() {
  const today = new Date();
  const anchorDate = new Date(ANCHOR.year, ANCHOR.month - 1, ANCHOR.day);
  return today < anchorDate ? anchorDate : new Date(today.getFullYear(), today.getMonth(), 1);
}

function dateFromIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateDifferenceInDays(date) {
  const start = Date.UTC(ANCHOR.year, ANCHOR.month - 1, ANCHOR.day);
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target - start) / 86400000);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function getShift(name, date) {
  const person = staff.find((item) => item.name === name);
  if (!person) return "";

  if (person.type === "weekly") {
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) return "休";
    return weekday === 1 ? "早+中" : "早";
  }

  return person.cycle[positiveModulo(dateDifferenceInDays(date), 49)];
}

function cellClass(shift) {
  if (shift === "休") return "rest";
  return shift.includes("晚") ? "night" : "day";
}

function renderMonth(year, monthIndex) {
  displayedDate = new Date(year, monthIndex, 1);
  const displayYear = displayedDate.getFullYear();
  const displayMonthIndex = displayedDate.getMonth();
  const numberOfDays = new Date(displayYear, displayMonthIndex + 1, 0).getDate();

  yearInput.value = displayYear;
  monthInput.value = displayMonthIndex + 1;
  document.querySelector("#month-title").textContent = `${displayYear} 年 ${displayMonthIndex + 1} 月值班表`;

  const dates = Array.from({ length: numberOfDays }, (_, index) => new Date(displayYear, displayMonthIndex, index + 1));
  const dateHeader = dates.map((date, index) => `<th data-day-index="${index}" class="${isWeekend(date) ? "weekend" : ""}" scope="col">${date.getDate()}</th>`).join("");
  const weekdayHeader = dates.map((date, index) => `<th data-day-index="${index}" class="weekday ${isWeekend(date) ? "weekend" : ""}" scope="col">${WEEKDAYS[date.getDay()]}</th>`).join("");
  const rows = staff.map((person, staffIndex) => {
    const cells = dates.map((date, index) => {
      const shift = getShift(person.name, date);
      return `<td data-row-index="${staffIndex}" data-day-index="${index}" class="${cellClass(shift)}">${shift}</td>`;
    }).join("");
    return `<tr data-row-index="${staffIndex}"><th class="staff-name" scope="row">${person.name}</th>${cells}</tr>`;
  }).join("");

  table.innerHTML = `
    <thead>
      <tr><th class="corner" scope="col">日期</th>${dateHeader}</tr>
      <tr><th class="corner" scope="col">星期</th>${weekdayHeader}</tr>
    </thead>
    <tbody>${rows}</tbody>`;

  scheduleCrosshair.classList.remove("is-visible");

  renderMobileSchedule(dates);
}

function renderMobileSchedule(dates) {
  mobileSchedule.innerHTML = dates.map((date) => {
    const shifts = staff.map((person) => {
      const shift = getShift(person.name, date);
      return `<div class="mobile-shift"><span class="mobile-shift-name">${person.name}</span><span class="mobile-shift-badge ${cellClass(shift)}">${shift}</span></div>`;
    }).join("");
    return `<article class="mobile-day-card"><header class="mobile-day-heading ${isWeekend(date) ? "weekend" : ""}"><span class="mobile-day-number">${date.getMonth() + 1} 月 ${date.getDate()} 日</span><span class="mobile-day-weekday">${WEEKDAYS[date.getDay()]}</span></header><div class="mobile-shifts">${shifts}</div></article>`;
  }).join("");
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function showQueryResult(name, date) {
  const shift = getShift(name, date);
  const rest = shift === "休";
  const resultText = rest ? "休息" : shift;
  queryResult.className = `query-result is-${cellClass(shift)}`;
  queryResult.innerHTML = `<strong>${name}</strong> · ${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日（${WEEKDAYS[date.getDay()]}）：<strong>${resultText}</strong>`;
}

function changeMonth(offset) {
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth() + offset);
}

function populateStaffOptions() {
  staffSelect.innerHTML = staff.map((person) => `<option value="${person.name}">${person.name}</option>`).join("");
}

document.querySelector("#go-month").addEventListener("click", () => {
  const year = Number(yearInput.value);
  const month = Number(monthInput.value);
  if (!Number.isInteger(year) || !Number.isInteger(month) || year < 2026 || month < 1 || month > 12) {
    window.alert("请输入 2026 年及以后的有效年份，以及 1 至 12 的月份。");
    return;
  }
  renderMonth(year, month - 1);
});

document.querySelector("#previous-month").addEventListener("click", () => changeMonth(-1));
document.querySelector("#next-month").addEventListener("click", () => changeMonth(1));
document.querySelector("#return-current-month").addEventListener("click", () => {
  const today = new Date();
  renderMonth(today.getFullYear(), today.getMonth());
});

table.addEventListener("click", (event) => {
  if (didDrag) {
    event.stopPropagation();
    return;
  }
  const cell = event.target.closest("td");
  if (!cell) return;

  table.querySelectorAll("td.is-selected").forEach((item) => item.classList.remove("is-selected"));
  cell.classList.add("is-selected");

  const cellBox = cell.getBoundingClientRect();
  const tableBox = tableScroll.getBoundingClientRect();
  scheduleCrosshair.style.setProperty("--cross-x", `${cellBox.left - tableBox.left + cellBox.width / 2}px`);
  scheduleCrosshair.style.setProperty("--cross-y", `${cellBox.top - tableBox.top + cellBox.height / 2}px`);
  scheduleCrosshair.classList.add("is-visible");
});

function highlightRange(endCell) {
  if (!dragStartCell) return;
  const startRow = Number(dragStartCell.dataset.rowIndex);
  const startDay = Number(dragStartCell.dataset.dayIndex);
  const endRow = Number(endCell.dataset.rowIndex);
  const endDay = Number(endCell.dataset.dayIndex);
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minDay = Math.min(startDay, endDay);
  const maxDay = Math.max(startDay, endDay);

  clearRangeHighlight();
  table.querySelectorAll("td[data-row-index][data-day-index]").forEach((cell) => {
    const row = Number(cell.dataset.rowIndex);
    const day = Number(cell.dataset.dayIndex);
    if (row >= minRow && row <= maxRow && day >= minDay && day <= maxDay) {
      cell.classList.add("is-range-highlight");
    }
  });
  table.querySelectorAll("thead [data-day-index]").forEach((header) => {
    const day = Number(header.dataset.dayIndex);
    if (day >= minDay && day <= maxDay) header.classList.add("is-range-date");
  });
}

function clearRangeHighlight() {
  table.querySelectorAll(".is-range-highlight, .is-range-date").forEach((item) => {
    item.classList.remove("is-range-highlight", "is-range-date");
  });
}

table.addEventListener("pointerdown", (event) => {
  if (!event.target.closest("td")) return;
  dragStartCell = event.target.closest("td[data-row-index]");
  dragStartPoint = { x: event.clientX, y: event.clientY };
  didDrag = false;
  scheduleCrosshair.classList.remove("is-visible");
  table.querySelectorAll("td.is-selected").forEach((item) => item.classList.remove("is-selected"));
});

table.addEventListener("pointermove", (event) => {
  if (!dragStartCell) return;
  if (Math.abs(event.clientX - dragStartPoint.x) < 6 && Math.abs(event.clientY - dragStartPoint.y) < 6) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("td[data-row-index][data-day-index]");
  if (!target) return;
  didDrag = true;
  highlightRange(target);
});

function stopDragging() {
  dragStartCell = null;
  dragStartPoint = null;
  window.setTimeout(() => {
    didDrag = false;
  }, 0);
}

table.addEventListener("pointerup", stopDragging);
table.addEventListener("pointercancel", stopDragging);

document.addEventListener("click", clearRangeHighlight);

document.querySelector("#query-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const date = dateFromIso(dateInput.value);
  if (Number.isNaN(date.getTime())) return;
  showQueryResult(staffSelect.value, date);
});

populateStaffOptions();
dateInput.value = toIso(displayedDate);
renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());

// 供浏览器控制台核对，月表和查询功能均通过同一方法计算班次。
window.getShift = getShift;
window.renderMonth = renderMonth;
