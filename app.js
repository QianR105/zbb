"use strict";

const ANCHOR = { year: 2026, month: 7, day: 1 };
const SCHEDULE_START_DATE = new Date(2026, 6, 1);
const SCHEDULE_END_DATE = new Date(2100, 11, 1);
const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const LEGAL_HOLIDAY_CACHE = new Map();
const SOLAR_TERM_MINUTES = [0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758];
// 1900—2100 年农历闰月及大小月数据表，用于离线换算，不依赖浏览器农历实现。
const LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
  0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
  0x0d520
];

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
const legalOvertimeOverlays = document.querySelector("#legal-overtime-overlays");
const mobileSchedule = document.querySelector("#mobile-schedule");
const staffSelect = document.querySelector("#staff-select");
const dateInput = document.querySelector("#date-input");
const queryResult = document.querySelector("#query-result");
const scheduleFullscreenButton = document.querySelector("#schedule-fullscreen");
const shiftOverrides = {};
const GOLD_FLOW_DURATION_MS = 1800;

document.querySelector(".legend").insertAdjacentHTML(
  "beforeend",
  "<span id=\"legal-holiday-legend\"><i class=\"legend-swatch legal-overtime\"></i>无</span>"
);

let displayedDate = getInitialDate();
let dragStartCell = null;
let dragStartPoint = null;
let didDrag = false;
let longPressTimer = null;
let exchangeMode = false;
let exchangeTargetCell = null;
let exchangeSource = null;
let splitOptionCell = null;
let dragSourcePart = null;
let dragSourcePartElement = null;
let headerRangeStartDay = null;
let suppressNextRangeClear = false;
let scheduleFullscreenScrollTop = 0;

function getInitialDate() {
  const today = new Date();
  return today < SCHEDULE_START_DATE ? new Date(SCHEDULE_START_DATE) : new Date(today.getFullYear(), today.getMonth(), 1);
}

// 让每次重绘出的鎏金边框接入同一时间轴，避免拆分、移动等操作后从头闪烁。
function goldFlowDelay() {
  return `-${Date.now() % GOLD_FLOW_DURATION_MS}ms`;
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

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function lunarLeapMonth(year) {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function lunarLeapDays(year) {
  const leapMonth = lunarLeapMonth(year);
  return leapMonth ? (LUNAR_INFO[year - 1900] & 0x10000 ? 30 : 29) : 0;
}

function lunarMonthDays(year, month) {
  return LUNAR_INFO[year - 1900] & (0x10000 >> month) ? 30 : 29;
}

function lunarYearDays(year) {
  let days = 348;
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
    if (LUNAR_INFO[year - 1900] & bit) days += 1;
  }
  return days + lunarLeapDays(year);
}

function findLunarFestivalDate(year, month, day) {
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;

  let offset = day - 1;
  for (let lunarYear = 1900; lunarYear < year; lunarYear += 1) offset += lunarYearDays(lunarYear);
  for (let lunarMonth = 1; lunarMonth < month; lunarMonth += 1) {
    offset += lunarMonthDays(year, lunarMonth);
    if (lunarLeapMonth(year) === lunarMonth) offset += lunarLeapDays(year);
  }

  return addDays(new Date(1900, 0, 31), offset);
}

function qingmingDate(year) {
  const base = Date.UTC(1900, 0, 6, 2, 5);
  const timestamp = base + 31556925974.7 * (year - 1900) + SOLAR_TERM_MINUTES[6] * 60000;
  const date = new Date(timestamp);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function addLegalHoliday(holidays, date, name) {
  holidays.set(toIso(date), name);
}

function legalHolidaysForYear(year) {
  if (LEGAL_HOLIDAY_CACHE.has(year)) return LEGAL_HOLIDAY_CACHE.get(year);

  const holidays = new Map();
  addLegalHoliday(holidays, new Date(year, 0, 1), "元旦");
  addLegalHoliday(holidays, qingmingDate(year), "清明节");
  addLegalHoliday(holidays, new Date(year, 4, 1), "劳动节");
  addLegalHoliday(holidays, new Date(year, 4, 2), "劳动节");
  addLegalHoliday(holidays, new Date(year, 9, 1), "国庆节");
  addLegalHoliday(holidays, new Date(year, 9, 2), "国庆节");
  addLegalHoliday(holidays, new Date(year, 9, 3), "国庆节");

  const springFestival = findLunarFestivalDate(year, 1, 1);
  if (springFestival) {
    [-1, 0, 1, 2].forEach((offset) => addLegalHoliday(holidays, addDays(springFestival, offset), "春节"));
  }
  const dragonBoatFestival = findLunarFestivalDate(year, 5, 5);
  if (dragonBoatFestival) addLegalHoliday(holidays, dragonBoatFestival, "端午节");
  const midAutumnFestival = findLunarFestivalDate(year, 8, 15);
  if (midAutumnFestival) addLegalHoliday(holidays, midAutumnFestival, "中秋节");

  LEGAL_HOLIDAY_CACHE.set(year, holidays);
  return holidays;
}

function legalHolidayName(date) {
  return legalHolidaysForYear(date.getFullYear()).get(toIso(date)) || "";
}

function isLegalOvertimeDate(date) {
  return Boolean(legalHolidayName(date));
}

function dateDifferenceInDays(date) {
  const start = Date.UTC(ANCHOR.year, ANCHOR.month - 1, ANCHOR.day);
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((target - start) / 86400000);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function overrideKey(name, date) {
  return `${name}|${toIso(date)}`;
}

function getShift(name, date) {
  const key = overrideKey(name, date);
  if (Object.prototype.hasOwnProperty.call(shiftOverrides, key)) return shiftOverrides[key];

  const person = staff.find((item) => item.name === name);
  if (!person) return "";

  if (person.type === "weekly") {
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) return "休";
    return weekday === 1 ? "早+中" : "早";
  }

  return person.cycle[positiveModulo(dateDifferenceInDays(date), 49)];
}

function shiftParts(shift) {
  return String(shift).split("|");
}

function displayShift(shift) {
  return shiftParts(shift).join(" / ");
}

function shiftCellContent(shift) {
  const parts = shiftParts(shift);
  if (parts.length === 1) {
    const compactShift = shift.replace("+", "");
    return `<span class="shift-full">${shift}</span><span class="shift-compact" aria-label="${shift}">${compactShift}</span>`;
  }
  return `<span class="split-shift" data-shift-part="${parts[0]}">${parts[0]}</span><span class="split-divider" aria-hidden="true"></span><span class="split-shift" data-shift-part="${parts[1]}">${parts[1]}</span>`;
}

function isSplittableShift(shift) {
  return shift === "\u65e9+\u4e2d" || shift === "\u4e2d+\u665a";
}

function cellClass(shift) {
  if (shift === "休") return "rest";
  return shift.includes("晚") ? "night" : "day";
}

function renderMonth(year, monthIndex) {
  const requestedDate = new Date(year, monthIndex, 1);
  displayedDate = requestedDate < SCHEDULE_START_DATE ? new Date(SCHEDULE_START_DATE) : requestedDate > SCHEDULE_END_DATE ? new Date(SCHEDULE_END_DATE) : requestedDate;
  const displayYear = displayedDate.getFullYear();
  const displayMonthIndex = displayedDate.getMonth();
  const numberOfDays = new Date(displayYear, displayMonthIndex + 1, 0).getDate();

  yearInput.value = displayYear;
  monthInput.value = displayMonthIndex + 1;
  document.querySelector("#previous-month").disabled = displayedDate.getTime() <= SCHEDULE_START_DATE.getTime();
  document.querySelector("#next-month").disabled = displayedDate.getTime() >= SCHEDULE_END_DATE.getTime();
  document.querySelector("#month-title").textContent = `${displayYear} 年 ${displayMonthIndex + 1} 月值班表`;

  const dates = Array.from({ length: numberOfDays }, (_, index) => new Date(displayYear, displayMonthIndex, index + 1));
  const dateHeader = dates.map((date, index) => {
    const holidayClass = isLegalOvertimeDate(date) ? " legal-overtime" : "";
    const holidayTitle = isLegalOvertimeDate(date) ? " title=\"法定节假日加班工资日\"" : "";
    return `<th data-day-index="${index}" class="${isWeekend(date) ? "weekend" : ""}${holidayClass}" scope="col"${holidayTitle}>${date.getDate()}</th>`;
  }).join("");
  const weekdayHeader = dates.map((date, index) => {
    const holidayClass = isLegalOvertimeDate(date) ? " legal-overtime" : "";
    const holidayTitle = isLegalOvertimeDate(date) ? " title=\"法定节假日加班工资日\"" : "";
    const weekday = WEEKDAYS[date.getDay()];
    return `<th data-day-index="${index}" class="weekday ${isWeekend(date) ? "weekend" : ""}${holidayClass}" scope="col"${holidayTitle}><span class="weekday-full">${weekday}</span><span class="weekday-short" aria-label="${weekday}">${weekday.replace("星期", "")}</span></th>`;
  }).join("");
  const rows = staff.map((person, staffIndex) => {
    const cells = dates.map((date, index) => {
      const shift = getShift(person.name, date);
      const splitCellClass = shiftParts(shift).length > 1 ? " split-cell" : "";
      const holidayClass = isLegalOvertimeDate(date) ? " legal-overtime" : "";
      const holidayTitle = isLegalOvertimeDate(date) ? " title=\"法定节假日加班工资日\"" : "";
      return `<td data-row-index="${staffIndex}" data-day-index="${index}" class="${cellClass(shift)}${splitCellClass}${holidayClass}"${holidayTitle}>${shiftCellContent(shift)}</td>`;
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
  renderLegalOvertimeOverlays(dates);
  updateLegalHolidayLegend(dates);

  renderMobileSchedule(dates);
}

function updateLegalHolidayLegend(dates) {
  const holidayNames = [...new Set(dates.map(legalHolidayName).filter(Boolean))];
  document.querySelector("#legal-holiday-legend").innerHTML = `<i class="legend-swatch legal-overtime"></i>${holidayNames.length ? holidayNames.join("、") : "无"}`;
}

function positionLegalOvertimeOverlays() {
  const containerBox = tableScroll.getBoundingClientRect();
  legalOvertimeOverlays.querySelectorAll(".legal-overtime-column").forEach((overlay) => {
    const startIndex = overlay.dataset.startIndex;
    const endIndex = overlay.dataset.endIndex;
    const firstHeader = table.querySelector(`thead th[data-day-index="${startIndex}"]`);
    const lastHeader = table.querySelector(`thead th[data-day-index="${endIndex}"]`);
    const lastCell = table.querySelector(`tbody tr:last-child td[data-day-index="${endIndex}"]`);
    if (!firstHeader || !lastHeader || !lastCell) return;
    const firstHeaderBox = firstHeader.getBoundingClientRect();
    const lastHeaderBox = lastHeader.getBoundingClientRect();
    const lastCellBox = lastCell.getBoundingClientRect();
    overlay.style.left = `${firstHeaderBox.left - containerBox.left}px`;
    overlay.style.top = `${firstHeaderBox.top - containerBox.top}px`;
    overlay.style.width = `${lastHeaderBox.right - firstHeaderBox.left}px`;
    overlay.style.height = `${lastCellBox.bottom - firstHeaderBox.top}px`;
  });
}

function renderLegalOvertimeOverlays(dates) {
  const groups = [];
  let index = 0;
  while (index < dates.length) {
    if (!isLegalOvertimeDate(dates[index])) {
      index += 1;
      continue;
    }
    const startIndex = index;
    while (index + 1 < dates.length && isLegalOvertimeDate(dates[index + 1])) index += 1;
    groups.push({ startIndex, endIndex: index });
    index += 1;
  }

  const flowDelay = goldFlowDelay();
  legalOvertimeOverlays.innerHTML = groups
    .map((group) => `<div class="legal-overtime-column" style="animation-delay: ${flowDelay}" data-start-index="${group.startIndex}" data-end-index="${group.endIndex}"></div>`)
    .join("");
  window.requestAnimationFrame(positionLegalOvertimeOverlays);
}

function renderMobileSchedule(dates) {
  mobileSchedule.innerHTML = dates.map((date) => {
    const legalOvertime = isLegalOvertimeDate(date);
    const flowStyle = legalOvertime ? ` style="animation-delay: ${goldFlowDelay()}"` : "";
    const shifts = staff.map((person) => {
      const shift = getShift(person.name, date);
      return `<div class="mobile-shift"><span class="mobile-shift-name">${person.name}</span><span class="mobile-shift-badge ${cellClass(shift)}">${displayShift(shift)}</span></div>`;
    }).join("");
    return `<article class="mobile-day-card${isWeekend(date) ? " weekend-day" : ""}${legalOvertime ? " legal-overtime" : ""}" data-schedule-date="${toIso(date)}"${flowStyle}><header class="mobile-day-heading ${isWeekend(date) ? "weekend" : ""}"><span class="mobile-day-number">${date.getMonth() + 1} 月 ${date.getDate()} 日</span><span class="mobile-day-weekday">${WEEKDAYS[date.getDay()]}</span></header><div class="mobile-shifts">${shifts}</div></article>`;
  }).join("");
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function showQueryResult(name, date) {
  const shift = getShift(name, date);
  const rest = shift === "休";
  const resultText = rest ? "休息" : displayShift(shift);
  queryResult.className = `query-result is-${cellClass(shift)}`;
  queryResult.innerHTML = `<strong>${name}</strong> · ${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日（${WEEKDAYS[date.getDay()]}）：<strong>${resultText}</strong>`;
}

function changeMonth(offset) {
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth() + offset);
}

function updateScheduleFullscreenState(active) {
  document.body.classList.toggle("is-schedule-fullscreen", active);
  scheduleFullscreenButton.textContent = active ? "× 退出" : "⛶ 全屏";
  scheduleFullscreenButton.setAttribute("aria-pressed", String(active));
  window.requestAnimationFrame(positionLegalOvertimeOverlays);
  if (!active) restoreSchedulePagePosition();
}

function restoreSchedulePagePosition() {
  // 浏览器退出全屏时会重新显示工具栏并改变可视高度，延后恢复能避免页面向上跳动。
  window.setTimeout(() => {
    const maximumTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(scheduleFullscreenScrollTop, maximumTop), behavior: "auto" });
  }, 80);
}

function currentFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

async function requestPageFullscreen() {
  const requestFullscreen = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
  if (requestFullscreen) await requestFullscreen.call(document.documentElement);
}

async function exitPageFullscreen() {
  const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
  if (exitFullscreen) await exitFullscreen.call(document);
}

async function toggleScheduleFullscreen() {
  if (scheduleFullscreenButton.disabled) return;
  scheduleFullscreenButton.disabled = true;
  const active = document.body.classList.contains("is-schedule-fullscreen");
  try {
    if (active) {
      if (currentFullscreenElement()) await exitPageFullscreen();
      updateScheduleFullscreenState(false);
      screen.orientation?.unlock?.();
      return;
    }

    scheduleFullscreenScrollTop = window.scrollY;
    updateScheduleFullscreenState(true);
    try {
      await requestPageFullscreen();
    } catch (_) {
      // 少数手机浏览器不支持网页全屏时，仍提供隐藏查询区的横屏查看模式。
    }
    try {
      await screen.orientation?.lock?.("landscape");
    } catch (_) {
      // 不支持锁定方向的浏览器可由用户手动横置手机查看。
    }
  } finally {
    scheduleFullscreenButton.disabled = false;
  }
}

function populateStaffOptions() {
  staffSelect.innerHTML = staff.map((person) => `<option value="${person.name}">${person.name}</option>`).join("");
}

document.querySelector("#go-month").addEventListener("click", () => {
  const year = Number(yearInput.value);
  const month = Number(monthInput.value);
  if (!Number.isInteger(year) || !Number.isInteger(month) || year < 2026 || year > 2100 || month < 1 || month > 12 || new Date(year, month - 1, 1) < SCHEDULE_START_DATE) {
    window.alert("排班表仅提供 2026 年 7 月至 2100 年的月份。");
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

document.addEventListener("keydown", (event) => {
  if (!window.matchMedia("(min-width: 761px)").matches) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

  if (exchangeMode && exchangeSource) {
    event.preventDefault();
    if (!event.repeat) {
      clearExchangePreview();
      changeMonth(event.key === "ArrowLeft" ? -1 : 1);
    }
    return;
  }

  const target = event.target;
  if (target.matches("input, select, textarea, button") || target.isContentEditable) return;

  event.preventDefault();
  changeMonth(event.key === "ArrowLeft" ? -1 : 1);
});

table.addEventListener("click", (event) => {
  if (didDrag) {
    event.stopPropagation();
    return;
  }
  const cell = event.target.closest("td");
  if (!cell) return;

  showSchedulePosition(cell);
});

// 日期/星期表头选列后不让点击事件冒泡到页面，标红会一直保留到用户点击其他位置。
table.addEventListener("click", (event) => {
  if (event.target.closest("thead th[data-day-index]")) event.stopPropagation();
});

function showSchedulePosition(cell) {
  table.querySelectorAll("td.is-selected").forEach((item) => item.classList.remove("is-selected"));
  cell.classList.add("is-selected");

  const cellBox = cell.getBoundingClientRect();
  const tableBox = tableScroll.getBoundingClientRect();
  scheduleCrosshair.style.setProperty("--cross-x", `${cellBox.left - tableBox.left + cellBox.width / 2}px`);
  scheduleCrosshair.style.setProperty("--cross-y", `${cellBox.top - tableBox.top + cellBox.height / 2}px`);
  scheduleCrosshair.classList.add("is-visible");
}

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

function highlightDateColumns(startDay, endDay) {
  const firstDay = Math.min(startDay, endDay);
  const lastDay = Math.max(startDay, endDay);
  clearRangeHighlight();
  table.querySelectorAll("td[data-day-index]").forEach((cell) => {
    const day = Number(cell.dataset.dayIndex);
    if (day >= firstDay && day <= lastDay) cell.classList.add("is-range-highlight");
  });
  table.querySelectorAll("thead [data-day-index]").forEach((header) => {
    const day = Number(header.dataset.dayIndex);
    if (day >= firstDay && day <= lastDay) header.classList.add("is-range-date");
  });
}

function clearRangeHighlight() {
  table.querySelectorAll(".is-range-highlight, .is-range-date").forEach((item) => {
    item.classList.remove("is-range-highlight", "is-range-date");
  });
}

function clearSchedulePosition() {
  scheduleCrosshair.classList.remove("is-visible");
  table.querySelectorAll("td.is-selected").forEach((item) => item.classList.remove("is-selected"));
}

function clearExchangePreview() {
  table.querySelectorAll(".is-exchange-source, .is-exchange-target, .is-exchange-source-part, .is-exchange-source-top, .is-exchange-source-bottom").forEach((item) => {
    item.classList.remove("is-exchange-source", "is-exchange-target", "is-exchange-source-part", "is-exchange-source-top", "is-exchange-source-bottom");
  });
  exchangeTargetCell = null;
}

function clearSplitOption() {
  table.querySelectorAll(".split-action").forEach((button) => button.remove());
  table.querySelectorAll("td.is-split-option").forEach((cell) => cell.classList.remove("is-split-option"));
  splitOptionCell = null;
}

function splitScheduleEntry(cell) {
  const entry = scheduleEntryForCell(cell);
  const shift = getShift(entry.name, entry.date);
  if (!isSplittableShift(shift)) return;
  shiftOverrides[overrideKey(entry.name, entry.date)] = shift.replace("+", "|");
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
}

function combinedSplitShift(shift) {
  const parts = shiftParts(shift);
  if (parts.length !== 2) return null;
  return mergedSingleShift(parts[0], parts[1]);
}

function cancelSplitScheduleEntry(cell) {
  const entry = scheduleEntryForCell(cell);
  const combinedShift = combinedSplitShift(getShift(entry.name, entry.date));
  if (!combinedShift) return;
  shiftOverrides[overrideKey(entry.name, entry.date)] = combinedShift;
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
}

function showSplitOption(cell, action) {
  clearSplitOption();
  splitOptionCell = cell;
  cell.classList.add("is-split-option");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "split-action";
  button.textContent = action === "split" ? "拆分" : "取消拆分";
  button.setAttribute("aria-label", action === "split" ? "拆分为两个单班次" : "取消拆分并恢复双班次");
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (action === "split") splitScheduleEntry(cell);
    else cancelSplitScheduleEntry(cell);
  });
  cell.appendChild(button);
}

function dateForCell(cell) {
  return new Date(displayedDate.getFullYear(), displayedDate.getMonth(), Number(cell.dataset.dayIndex) + 1);
}

function scheduleEntryForCell(cell, part = null) {
  return {
    name: staff[Number(cell.dataset.rowIndex)].name,
    date: dateForCell(cell),
    part
  };
}

function mergedSingleShift(firstShift, secondShift) {
  const morning = "\u65e9";
  const middle = "\u4e2d";
  const night = "\u665a";

  if (firstShift === morning && secondShift === middle || firstShift === middle && secondShift === morning) {
    return "\u65e9+\u4e2d";
  }
  if (firstShift === middle && secondShift === night || firstShift === night && secondShift === middle) {
    return "\u4e2d+\u665a";
  }
  return null;
}

function setSplitParts(entry, parts) {
  const remaining = parts.filter((part) => part !== "\u4f11");
  shiftOverrides[overrideKey(entry.name, entry.date)] = remaining.length ? remaining.join("|") : "\u4f11";
}

function moveSplitPart(source, targetCell) {
  const sourceParts = shiftParts(getShift(source.name, source.date));
  const sourcePartIndex = sourceParts.indexOf(source.part);
  if (sourcePartIndex < 0) return;

  const target = scheduleEntryForCell(targetCell);
  const targetShift = getShift(target.name, target.date);
  const rest = "\u4f11";

  if (targetShift === rest) {
    sourceParts.splice(sourcePartIndex, 1);
    setSplitParts(source, sourceParts);
    shiftOverrides[overrideKey(target.name, target.date)] = source.part;
  } else if (["\u65e9", "\u4e2d", "\u665a"].includes(targetShift)) {
    const mergedShift = mergedSingleShift(source.part, targetShift);
    if (mergedShift) {
      sourceParts.splice(sourcePartIndex, 1);
      setSplitParts(source, sourceParts);
      shiftOverrides[overrideKey(target.name, target.date)] = mergedShift;
    } else if (source.part === targetShift) {
      return;
    } else {
      sourceParts[sourcePartIndex] = targetShift;
      setSplitParts(source, sourceParts);
      shiftOverrides[overrideKey(target.name, target.date)] = source.part;
    }
  } else {
    return;
  }

  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
}

function mergeOrSwapScheduleEntries(source, targetCell) {
  if (!source || !targetCell) return;

  if (source.part) {
    moveSplitPart(source, targetCell);
    return;
  }

  const target = scheduleEntryForCell(targetCell);
  const sourceShift = getShift(source.name, source.date);
  const targetShift = getShift(target.name, target.date);
  const mergedShift = mergedSingleShift(sourceShift, targetShift);

  // 两个单班次优先融合；相同班次不改变，其他无法融合的组合继续按交换处理。
  if (["\u65e9", "\u4e2d", "\u665a"].includes(sourceShift) && ["\u65e9", "\u4e2d", "\u665a"].includes(targetShift)) {
    if (mergedShift) {
      shiftOverrides[overrideKey(source.name, source.date)] = "\u4f11";
      shiftOverrides[overrideKey(target.name, target.date)] = mergedShift;
      renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
      return;
    }
    if (sourceShift === targetShift) return;
  }

  swapScheduleEntries(source, targetCell);
}

function swapScheduleEntries(source, targetCell) {
  if (!source || !targetCell) return;

  const target = scheduleEntryForCell(targetCell);
  if (source.name === target.name && toIso(source.date) === toIso(target.date)) return;

  const sourceName = source.name;
  const targetName = target.name;
  const sourceDate = source.date;
  const targetDate = dateForCell(targetCell);
  const sourceKey = overrideKey(sourceName, sourceDate);
  const targetKey = overrideKey(targetName, targetDate);
  const sourceShift = getShift(sourceName, sourceDate);
  const targetShift = getShift(targetName, targetDate);

  shiftOverrides[sourceKey] = targetShift;
  shiftOverrides[targetKey] = sourceShift;
  renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());
}

table.addEventListener("pointerdown", (event) => {
  const header = event.target.closest("thead th[data-day-index]");
  if (header && event.button === 0) {
    event.preventDefault();
    headerRangeStartDay = Number(header.dataset.dayIndex);
    clearSchedulePosition();
    clearSplitOption();
    highlightDateColumns(headerRangeStartDay, headerRangeStartDay);
    return;
  }
  if (event.button === 2) return;
  if (event.target.closest(".split-action")) return;
  if (event.target.closest(".split-divider")) return;
  if (!event.target.closest("td")) return;
  dragStartCell = event.target.closest("td[data-row-index]");
  dragStartPoint = { x: event.clientX, y: event.clientY };
  dragSourcePartElement = event.target.closest(".split-shift");
  dragSourcePart = dragSourcePartElement?.dataset.shiftPart || null;
  if (dragStartCell.classList.contains("split-cell")) {
    const parts = shiftParts(getShift(
      staff[Number(dragStartCell.dataset.rowIndex)].name,
      dateForCell(dragStartCell)
    ));
    const cellBox = dragStartCell.getBoundingClientRect();
    const partIndex = event.clientY - cellBox.top < cellBox.height / 2 ? 0 : 1;
    dragSourcePart = parts[partIndex];
    dragSourcePartElement = dragStartCell.querySelectorAll(".split-shift")[partIndex];
  }
  didDrag = false;
  exchangeMode = false;
  exchangeSource = null;
  clearSplitOption();
  clearExchangePreview();
  // 普通单击在按下时立即定位；只有真正拖动或长按时才会取消定位。
  showSchedulePosition(dragStartCell);
  clearRangeHighlight();
  table.setPointerCapture?.(event.pointerId);
  longPressTimer = window.setTimeout(() => {
    if (!dragStartCell) return;
    const entry = scheduleEntryForCell(dragStartCell, dragSourcePart);
    exchangeMode = true;
    didDrag = true;
    exchangeSource = entry;
    clearRangeHighlight();
    clearSchedulePosition();
    if (dragSourcePartElement) {
      dragSourcePartElement.classList.add("is-exchange-source-part");
      const partElements = dragStartCell.querySelectorAll(".split-shift");
      dragStartCell.classList.add(dragSourcePartElement === partElements[0] ? "is-exchange-source-top" : "is-exchange-source-bottom");
    } else {
      dragStartCell.classList.add("is-exchange-source");
    }
  }, 500);
});

table.addEventListener("pointermove", (event) => {
  if (headerRangeStartDay !== null) {
    const header = document.elementFromPoint(event.clientX, event.clientY)?.closest("thead th[data-day-index]");
    if (header) highlightDateColumns(headerRangeStartDay, Number(header.dataset.dayIndex));
    return;
  }
  if (!dragStartCell) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("td[data-row-index][data-day-index]");

  if (exchangeMode) {
    if (!target || target === dragStartCell) {
      table.querySelectorAll("td.is-exchange-target").forEach((item) => item.classList.remove("is-exchange-target"));
      exchangeTargetCell = null;
      return;
    }
    if (target === exchangeTargetCell) return;
    table.querySelectorAll("td.is-exchange-target").forEach((item) => item.classList.remove("is-exchange-target"));
    exchangeTargetCell = target;
    exchangeTargetCell.classList.add("is-exchange-target");
    return;
  }

  if (Math.abs(event.clientX - dragStartPoint.x) < 6 && Math.abs(event.clientY - dragStartPoint.y) < 6) return;
  window.clearTimeout(longPressTimer);
  longPressTimer = null;
  if (!target) return;
  didDrag = true;
  clearSchedulePosition();
  highlightRange(target);
});

function stopDragging(event, shouldSwap = true) {
  const pressedCell = dragStartCell;
  const wasExchange = exchangeMode;
  const releasedCell = document.elementFromPoint(event.clientX, event.clientY)?.closest("td[data-row-index][data-day-index]");
  window.clearTimeout(longPressTimer);
  longPressTimer = null;
  if (shouldSwap && exchangeMode && exchangeTargetCell) mergeOrSwapScheduleEntries(exchangeSource, exchangeTargetCell);
  clearExchangePreview();
  exchangeMode = false;
  exchangeSource = null;
  dragSourcePart = null;
  dragSourcePartElement = null;
  dragStartCell = null;
  dragStartPoint = null;
  if (event?.pointerId !== undefined && table.hasPointerCapture?.(event.pointerId)) {
    table.releasePointerCapture(event.pointerId);
  }

  // 正常单击在所有浏览器 click 事件结束后，再确认一次选中状态。
  // 这样长按/拖拽逻辑不会让红框在松开鼠标的一刻被清除。
  const isSingleCellClick = !wasExchange && pressedCell && (!didDrag || releasedCell === pressedCell || !releasedCell);
  if (isSingleCellClick) {
    didDrag = false;
    window.setTimeout(() => {
      clearRangeHighlight();
      showSchedulePosition(pressedCell);
    }, 0);
  }

  window.setTimeout(() => {
    didDrag = false;
  }, 0);
}

function stopHeaderRangeSelection(event) {
  if (headerRangeStartDay === null) return false;
  headerRangeStartDay = null;
  // 拖动表头松开时浏览器仍会补发一次 click；忽略这一次，避免刚选中的列立即被清除。
  suppressNextRangeClear = true;
  window.setTimeout(() => {
    suppressNextRangeClear = false;
  }, 450);
  if (event?.pointerId !== undefined && table.hasPointerCapture?.(event.pointerId)) {
    table.releasePointerCapture(event.pointerId);
  }
  return true;
}

table.addEventListener("pointerup", (event) => {
  if (!stopHeaderRangeSelection(event)) stopDragging(event, true);
});
table.addEventListener("pointercancel", (event) => {
  if (!stopHeaderRangeSelection(event)) stopDragging(event, false);
});

table.addEventListener("contextmenu", (event) => {
  const cell = event.target.closest("td[data-row-index][data-day-index]");
  if (!cell) return;
  event.preventDefault();
  const entry = scheduleEntryForCell(cell);
  const shift = getShift(entry.name, entry.date);
  if (isSplittableShift(shift)) showSplitOption(cell, "split");
  else if (combinedSplitShift(shift)) showSplitOption(cell, "cancel");
  else clearSplitOption();
});

document.addEventListener("click", (event) => {
  if (suppressNextRangeClear) {
    suppressNextRangeClear = false;
    return;
  }
  if (!event.target.closest("#schedule-table td, #schedule-table thead th[data-day-index]")) clearRangeHighlight();
  if (!event.target.closest("#schedule-table td")) clearSchedulePosition();
});

function scrollToPage(position) {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const top = position === "top" ? 0 : position === "bottom" ? maxScroll : Math.round(maxScroll / 2);
  window.scrollTo({ top, behavior: "smooth" });
}

function scrollToTodaySchedule() {
  const today = new Date();
  const firstAvailableDay = new Date(2026, 6, 1);
  const lastAvailableDay = new Date(2100, 11, 31);
  const targetDate = today < firstAvailableDay ? firstAvailableDay : today > lastAvailableDay ? lastAvailableDay : today;

  renderMonth(targetDate.getFullYear(), targetDate.getMonth());
  window.requestAnimationFrame(() => {
    mobileSchedule.querySelector(`[data-schedule-date="${toIso(targetDate)}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function showDoubleTapTip(button, tip) {
  button.dataset.doubleTapTip = tip;
  button.classList.add("show-double-tap-tip");
  window.clearTimeout(button.doubleTapTipTimer);
  button.doubleTapTipTimer = window.setTimeout(() => {
    button.classList.remove("show-double-tap-tip");
  }, 1600);
}

function requireDoubleTap(selector, action, tip) {
  const button = document.querySelector(selector);
  let lastTapAt = 0;

  button.addEventListener("click", (event) => {
    event.preventDefault();
    const now = Date.now();
    if (now - lastTapAt <= 550) {
      lastTapAt = 0;
      button.classList.remove("show-double-tap-tip");
      action();
      return;
    }
    lastTapAt = now;
    showDoubleTapTip(button, tip);
  });
}

requireDoubleTap("#go-page-top", () => scrollToPage("top"), "再点一次：回到顶部");
requireDoubleTap("#go-page-middle", () => scrollToPage("middle"), "再点一次：前往中间");
requireDoubleTap("#go-today-schedule", scrollToTodaySchedule, "再点一次：定位今天排班");
requireDoubleTap("#go-page-bottom", () => scrollToPage("bottom"), "再点一次：前往底部");
scheduleFullscreenButton.addEventListener("click", toggleScheduleFullscreen);
function handleFullscreenChange() {
  if (!currentFullscreenElement() && document.body.classList.contains("is-schedule-fullscreen")) {
    updateScheduleFullscreenState(false);
    screen.orientation?.unlock?.();
  }
}
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
window.addEventListener("resize", () => window.requestAnimationFrame(positionLegalOvertimeOverlays));

document.querySelector("#query-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const date = dateFromIso(dateInput.value);
  if (Number.isNaN(date.getTime())) return;
  showQueryResult(staffSelect.value, date);
});

populateStaffOptions();
dateInput.value = toIso(new Date());
renderMonth(displayedDate.getFullYear(), displayedDate.getMonth());

// 供浏览器控制台核对，月表和查询功能均通过同一方法计算班次。
window.getShift = getShift;
window.renderMonth = renderMonth;
