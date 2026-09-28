/* ==========================================
   STUDYFLOW ADAPTIVE ENGINE (app.js)
   ========================================== */

// --- Default Data Initialization ---
const DEFAULT_PROFILE = {
    name: "Alex Mercer",
    goal: "Pass AWS Solutions Architect Certification",
    deadline: "2026-07-25", // 28 days from current local time (2026-06-27)
    wakeTime: "07:00",
    sleepTime: "23:00",
    targetHours: 6,
    sessionLength: 50,
    flexibility: "moderate",
    lightDays: [0, 4], // Sunday (0) and Thursday (4)
    spacedIntervals: "1d, 3d, 7d",
    activeMethods: ["Practice Problems", "Flashcards", "Feynman Technique", "Past Papers", "Worked Examples"],
    quotes: {
        start: "The secret of getting ahead is getting started.",
        mid: "One block closer to your goal. Focus is power!",
        end: "Consistent effort compounded daily yields massive results."
    }
};

const DEFAULT_SUBJECTS = [
    { id: 1, name: "Cloud Architecture & Design", priority: "high", hours: 12 },
    { id: 2, name: "Networking & VPC Security", priority: "high", hours: 10 },
    { id: 3, name: "Database Services & Storage", priority: "medium", hours: 8 },
    { id: 4, name: "Cost Optimization & Billing", priority: "low", hours: 4 }
];

const DEFAULT_ENERGY = [
    { start: "09:00", end: "12:00", label: "Morning Focus Peak" },
    { start: "15:00", end: "18:00", label: "Afternoon Stamina" }
];

const DEFAULT_COMMITMENTS = [
    { label: "Morning Routine & Breakfast", start: "07:00", end: "08:30", day: "daily" },
    { label: "Lunch Break", start: "12:30", end: "13:30", day: "daily" },
    { label: "Dinner & Wind Down", start: "19:30", end: "20:30", day: "daily" },
    { label: "Weekly Status Sync", start: "14:00", end: "15:00", day: "3" } // Wednesday (3)
];

// --- App State ---
let subjects = [...DEFAULT_SUBJECTS];
let energyWindows = [...DEFAULT_ENERGY];
let commitments = [...DEFAULT_COMMITMENTS];
let currentScheduleJSON = {};

// --- Time Helper Functions ---
function timeToMin(timeStr) {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
}

function minToTime(mins) {
    const hrs = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minTo12Hr(mins) {
    const hrs = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    return `${displayHrs}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getDaysRemaining(deadlineStr) {
    const today = new Date("2026-06-27"); // Anchor to prompt's current date
    const deadlineDate = new Date(deadlineStr);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// --- DOM Initialization & Form Handlers ---
document.addEventListener("DOMContentLoaded", () => {
    // Populate Sidebar Dynamic Elements
    renderSubjectsForm();
    renderEnergyForm();
    renderCommitmentsForm();
    
    // Set Checkbox states for Light Days
    DEFAULT_PROFILE.lightDays.forEach(dayIndex => {
        const checkbox = document.getElementById(`day-${dayIndex}`);
        if (checkbox) checkbox.checked = true;
    });

    // Update countdown text on load
    updateCountdown();

    // Trigger Initial Generation
    generateSchedule();
});

function updateCountdown() {
    const deadlineVal = document.getElementById("exam-deadline").value;
    const daysLeft = getDaysRemaining(deadlineVal);
    const badge = document.getElementById("days-left-badge");
    const banner = document.getElementById("countdown-banner");
    const bannerText = document.getElementById("countdown-text");

    if (daysLeft >= 0) {
        badge.textContent = `${daysLeft} days remaining`;
        badge.className = "helper-text success-text";
        
        if (daysLeft <= 30) {
            banner.classList.remove("hidden");
            bannerText.innerHTML = `<i class="fa-solid fa-triangle-exclamation warning-icon"></i> <strong>Exam Countdown:</strong> Only <strong>${daysLeft} days</strong> left until your target date! Active past papers and exam simulation are prioritized in your study blocks.`;
        } else {
            banner.classList.add("hidden");
        }
    } else {
        badge.textContent = `Exam date passed!`;
        badge.className = "helper-text error-text";
        banner.classList.add("hidden");
    }
}

// --- Accordion Logic ---
function toggleAccordion(header) {
    const card = header.parentElement;
    card.classList.toggle("active");
}

// --- Tab Navigation Logic ---
function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.classList.remove("active");
    });

    // Find clicked tab button and activate it
    const activeBtn = Array.from(document.querySelectorAll(".tab-btn")).find(btn => 
        btn.getAttribute("onclick").includes(tabId)
    );
    if (activeBtn) activeBtn.classList.add("active");
    
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) targetPanel.classList.add("active");
}

// --- Subject List Management ---
function renderSubjectsForm() {
    const container = document.getElementById("subjects-container");
    container.innerHTML = "";
    subjects.forEach((subj, index) => {
        container.innerHTML += `
            <div class="dynamic-row" data-index="${index}">
                <input type="text" value="${subj.name}" placeholder="Subject Name" onchange="updateSubject(${index}, 'name', this.value)" style="flex: 2;">
                <select onchange="updateSubject(${index}, 'priority', this.value)" style="flex: 1.2;">
                    <option value="high" ${subj.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="medium" ${subj.priority === 'medium' ? 'selected' : ''}>Med</option>
                    <option value="low" ${subj.priority === 'low' ? 'selected' : ''}>Low</option>
                </select>
                <input type="number" value="${subj.hours}" min="1" max="40" placeholder="Hrs" onchange="updateSubject(${index}, 'hours', Number(this.value))" style="width: 60px;">
                <button type="button" class="btn-remove" onclick="removeSubjectRow(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });
}

function addSubjectRow() {
    subjects.push({ id: Date.now(), name: "New Subject", priority: "medium", hours: 6 });
    renderSubjectsForm();
}

function removeSubjectRow(index) {
    subjects.splice(index, 1);
    renderSubjectsForm();
}

function updateSubject(index, field, value) {
    subjects[index][field] = value;
}

// --- Energy Windows Management ---
function renderEnergyForm() {
    const container = document.getElementById("energy-container");
    container.innerHTML = "";
    energyWindows.forEach((win, index) => {
        container.innerHTML += `
            <div class="dynamic-row" data-index="${index}">
                <input type="time" value="${win.start}" onchange="updateEnergy(${index}, 'start', this.value)" style="flex: 1;">
                <span style="color: var(--text-muted);">to</span>
                <input type="time" value="${win.end}" onchange="updateEnergy(${index}, 'end', this.value)" style="flex: 1;">
                <input type="text" value="${win.label}" placeholder="Label" onchange="updateEnergy(${index}, 'label', this.value)" style="flex: 1.5;">
                <button type="button" class="btn-remove" onclick="removeEnergyRow(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });
}

function addEnergyRow() {
    energyWindows.push({ start: "19:00", end: "21:00", label: "Evening Peak" });
    renderEnergyForm();
}

function removeEnergyRow(index) {
    energyWindows.splice(index, 1);
    renderEnergyForm();
}

function updateEnergy(index, field, value) {
    energyWindows[index][field] = value;
}

// --- Fixed Commitments Management ---
function renderCommitmentsForm() {
    const container = document.getElementById("commitments-container");
    container.innerHTML = "";
    commitments.forEach((comm, index) => {
        container.innerHTML += `
            <div class="dynamic-row" data-index="${index}">
                <input type="text" value="${comm.label}" placeholder="Activity" onchange="updateCommitment(${index}, 'label', this.value)" style="flex: 1.5;">
                <input type="time" value="${comm.start}" onchange="updateCommitment(${index}, 'start', this.value)" style="flex: 1;">
                <input type="time" value="${comm.end}" onchange="updateCommitment(${index}, 'end', this.value)" style="flex: 1;">
                <select onchange="updateCommitment(${index}, 'day', this.value)" style="flex: 1.2;">
                    <option value="daily" ${comm.day === 'daily' ? 'selected' : ''}>Daily</option>
                    <option value="0" ${comm.day === '0' ? 'selected' : ''}>Sun</option>
                    <option value="1" ${comm.day === '1' ? 'selected' : ''}>Mon</option>
                    <option value="2" ${comm.day === '2' ? 'selected' : ''}>Tue</option>
                    <option value="3" ${comm.day === '3' ? 'selected' : ''}>Wed</option>
                    <option value="4" ${comm.day === '4' ? 'selected' : ''}>Thu</option>
                    <option value="5" ${comm.day === '5' ? 'selected' : ''}>Fri</option>
                    <option value="6" ${comm.day === '6' ? 'selected' : ''}>Sat</option>
                </select>
                <button type="button" class="btn-remove" onclick="removeCommitmentRow(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });
}

function addCommitmentRow() {
    commitments.push({ label: "Meeting / Class", start: "14:00", end: "15:00", day: "daily" });
    renderCommitmentsForm();
}

function removeCommitmentRow(index) {
    commitments.splice(index, 1);
    renderCommitmentsForm();
}

function updateCommitment(index, field, value) {
    commitments[index][field] = value;
}

// --- CORE SCHEDULING ENGINE ---
function generateSchedule() {
    updateCountdown();

    const name = document.getElementById("user-name").value;
    const goal = document.getElementById("primary-goal").value;
    const deadline = document.getElementById("exam-deadline").value;
    const wakeStr = document.getElementById("wake-time").value;
    const sleepStr = document.getElementById("sleep-time").value;
    const targetHours = Number(document.getElementById("target-hours").value);
    const sessionMin = Number(document.getElementById("session-length").value);
    const flex = document.getElementById("flex-tolerance").value;
    const spacedInterval = document.getElementById("spaced-interval").value;
    
    // Break rule calculation based on session length
    let breakMin = 10;
    if (sessionMin === 25) breakMin = 5;
    else if (sessionMin === 90) breakMin = 15;
    else if (sessionMin === 120) breakMin = 20;

    // Get checked light days
    const lightDays = [];
    for (let i = 0; i < 7; i++) {
        if (document.getElementById(`day-${i}`).checked) {
            lightDays.push(i);
        }
    }

    // Get checked study methods
    const activeMethods = [];
    document.querySelectorAll(".study-method:checked").forEach(checkbox => {
        activeMethods.push(checkbox.value);
    });
    if (activeMethods.length === 0) activeMethods.push("General Review");

    const quotes = {
        start: document.getElementById("quote-start").value,
        mid: document.getElementById("quote-mid").value,
        end: document.getElementById("quote-end").value
    };

    const daysLeft = getDaysRemaining(deadline);
    const isExamImpending = daysLeft >= 0 && daysLeft <= 30;

    // Update Greeting headers
    document.getElementById("welcome-title").textContent = `Hello, ${name}`;
    document.getElementById("welcome-goal").textContent = `Primary Goal: ${goal}`;

    // Run Engine for the three formats
    const typicalTimeline = buildDayTimeline("typical", wakeStr, sleepStr, targetHours, sessionMin, breakMin, flex, commitments, energyWindows, subjects, activeMethods, isExamImpending, quotes);
    const heavyTimeline = buildDayTimeline("heavy", wakeStr, sleepStr, targetHours * 1.5, sessionMin, breakMin, flex, commitments, energyWindows, subjects, activeMethods, isExamImpending, quotes);
    const lightTimeline = buildDayTimeline("light", wakeStr, sleepStr, targetHours * 0.5, sessionMin, breakMin, flex, commitments, energyWindows, subjects, activeMethods, isExamImpending, quotes);

    // Render Tables
    renderTable("typical-timetable-body", typicalTimeline);
    renderTable("heavy-timetable-body", heavyTimeline);
    renderTable("light-timetable-body", lightTimeline);

    // Set Quotes
    document.getElementById("typical-quote-start").textContent = quotes.start;
    document.getElementById("typical-quote-end").textContent = quotes.end;
    document.getElementById("heavy-quote-start").textContent = quotes.start;
    document.getElementById("heavy-quote-end").textContent = quotes.end;
    document.getElementById("light-quote-start").textContent = quotes.start;
    document.getElementById("light-quote-end").textContent = quotes.end;

    // Render Weekly Grid
    renderWeeklyGrid(subjects, lightDays, targetHours);

    // Render Spaced Repetition Plan
    renderSpacedRepetition(subjects, spacedInterval);

    // Save state as JSON
    currentScheduleJSON = {
        meta: {
            plannerName: "StudyFlow Adaptive Planner",
            generatedAt: "2026-06-27T13:58:44+05:30",
            userName: name,
            goal: goal,
            deadline: deadline,
            daysRemaining: daysLeft,
            flexibility: flex,
            breakRule: `${sessionMin}m study / ${breakMin}m break`,
            spacedIntervals: spacedInterval
        },
        subjects: subjects,
        typicalSchedule: typicalTimeline,
        heavySchedule: heavyTimeline,
        lightSchedule: lightTimeline,
        weeklyOverview: {
            weeklyTargetHours: calculateWeeklyHours(subjects),
            lightDays: lightDays.map(d => ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d]),
            priorityFocusDays: ["Monday", "Wednesday", "Friday"]
        },
        spacedRepetitionPlan: subjects.map(s => ({
            subject: s.name,
            milestones: generateMilestoneDetails(s.name, spacedInterval)
        }))
    };

    // Render JSON Code Block
    document.getElementById("json-output").textContent = JSON.stringify(currentScheduleJSON, null, 4);
}

// --- TIMELINE GENERATOR ENGINE ---
function buildDayTimeline(mode, wakeStr, sleepStr, targetHours, sessionMin, breakMin, flex, comms, energyWins, subjs, activeMethods, isExamImpending, quotes) {
    const wake = timeToMin(wakeStr);
    const sleep = timeToMin(sleepStr);
    const totalSlotSize = sessionMin + breakMin;

    // 1. Initial Timeline - start with one big free slot
    let timeline = [{ start: wake, end: sleep, type: 'free', label: 'Free Window' }];

    // 2. Insert Commitments
    // Filter commitments based on whether they apply (typical day uses daily, specific weekday commitments are ignored for generic layout or layered dynamically. Let's filter for daily or weekday 1-5)
    comms.forEach(comm => {
        const commStart = timeToMin(comm.start);
        const commEnd = timeToMin(comm.end);

        let newTimeline = [];
        timeline.forEach(slot => {
            if (slot.type !== 'free') {
                newTimeline.push(slot);
                return;
            }

            // No overlap
            if (commEnd <= slot.start || commStart >= slot.end) {
                newTimeline.push(slot);
            } 
            // Overlap: Split slot
            else {
                if (commStart > slot.start) {
                    newTimeline.push({ start: slot.start, end: commStart, type: 'free', label: 'Free Window' });
                }
                newTimeline.push({ start: commStart, end: commEnd, type: 'commitment', label: comm.label });
                if (commEnd < slot.end) {
                    newTimeline.push({ start: commEnd, end: slot.end, type: 'free', label: 'Free Window' });
                }
            }
        });
        timeline = newTimeline;
    });

    // 3. Grid Subdivision - Partition Free Windows into (Study Session + Break) intervals
    let finalTimeline = [];
    timeline.forEach(slot => {
        if (slot.type !== 'free') {
            finalTimeline.push(slot);
            return;
        }

        let currentPos = slot.start;
        const gapSize = slot.end - slot.start;
        const possibleBlocks = Math.floor(gapSize / totalSlotSize);

        for (let i = 0; i < possibleBlocks; i++) {
            finalTimeline.push({
                start: currentPos,
                end: currentPos + sessionMin,
                type: 'study_placeholder',
                label: 'Study Session',
                duration: sessionMin
            });
            finalTimeline.push({
                start: currentPos + sessionMin,
                end: currentPos + totalSlotSize,
                type: 'break',
                label: 'Short Break',
                duration: breakMin
            });
            currentPos += totalSlotSize;
        }

        // Remaining minutes in the slot become buffer/flex slots
        if (currentPos < slot.end) {
            finalTimeline.push({
                start: currentPos,
                end: slot.end,
                type: 'buffer',
                label: flex === 'strict' ? 'Leisure / Buffer' : 'Overflow Buffer Slot',
                duration: slot.end - currentPos
            });
        }
    });

    // 4. Sort and Analyze energy levels for study blocks
    let studySlots = finalTimeline.filter(s => s.type === 'study_placeholder');
    
    // Mark energy levels for each study slot
    studySlots.forEach(slot => {
        let isPeak = false;
        energyWins.forEach(win => {
            const winStart = timeToMin(win.start);
            const winEnd = timeToMin(win.end);
            
            // Checks if study slot mid-point lies in peak window
            const mid = (slot.start + slot.end) / 2;
            if (mid >= winStart && mid <= winEnd) {
                isPeak = true;
            }
        });
        slot.isPeak = isPeak;
    });

    // 5. Select slots to act as study blocks to hit Target Hours
    const targetBlocksNeeded = Math.min(
        studySlots.length,
        Math.round((targetHours * 60) / sessionMin)
    );

    // Prioritize Peak Energy slots for active study blocks
    studySlots.sort((a, b) => {
        if (a.isPeak && !b.isPeak) return -1;
        if (!a.isPeak && b.isPeak) return 1;
        return a.start - b.start; // Keep chronological
    });

    const activeStudySlots = studySlots.slice(0, targetBlocksNeeded);
    const deactivatedSlots = studySlots.slice(targetBlocksNeeded);

    // Change deactivated slots to buffer or leisure
    deactivatedSlots.forEach(slot => {
        slot.type = 'buffer';
        slot.label = 'Overflow / Adaptive Buffer';
    });

    // Sort timeline chronologically
    finalTimeline.sort((a, b) => a.start - b.start);

    // 6. Allocate subjects to active slots
    // Sort active study slots chronologically for allocation
    activeStudySlots.sort((a, b) => a.start - b.start);

    // Create a pool of subjects weighted by priority and hours
    let subjectPool = [];
    
    // Sort subjects by priority: high, medium, low
    const sortedSubjs = [...subjs].sort((a, b) => {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
    });

    if (sortedSubjs.length > 0) {
        // Simple round-robin based on priority focus
        let subjIndex = 0;
        activeStudySlots.forEach((slot, index) => {
            // Assign subject
            const assignedSubj = sortedSubjs[subjIndex % sortedSubjs.length];
            slot.subject = assignedSubj.name;
            slot.priority = assignedSubj.priority;
            slot.type = 'study';
            
            // Select active study method
            let method = activeMethods[index % activeMethods.length];
            
            // Impending exam condition: Replace at least one block of high-priority subjects with Past Papers
            if (isExamImpending && assignedSubj.priority === 'high' && activeMethods.includes('Past Papers')) {
                // Let's make every alternate High Priority block a "Timed Past Paper Practice" block
                if (index % 2 === 0) {
                    method = "Timed Past Paper Practice & Review";
                }
            }
            slot.method = method;

            subjIndex++;
        });
    }

    // Clean up labels and tags in the final timeline
    finalTimeline = finalTimeline.map(slot => {
        if (slot.type === 'study_placeholder') {
            // If it escaped allocation somehow, turn to buffer
            slot.type = 'buffer';
            slot.label = 'Adaptive Buffer Slot';
        }
        return slot;
    });

    // Injects mid-quote notice right before the final study block
    let studyCount = 0;
    const totalStudyBlocks = finalTimeline.filter(s => s.type === 'study').length;
    finalTimeline.forEach(slot => {
        if (slot.type === 'study') {
            studyCount++;
            if (studyCount === totalStudyBlocks && totalStudyBlocks > 1) {
                slot.showQuoteBefore = quotes.mid;
            }
        }
    });

    return finalTimeline;
}

// --- RENDER TIMETABLE TABLE ---
function renderTable(containerId, timeline) {
    const tbody = document.getElementById(containerId);
    tbody.innerHTML = "";

    timeline.forEach(slot => {
        const timeRange = `${minTo12Hr(slot.start)} - ${minTo12Hr(slot.end)}`;
        const duration = `${slot.end - slot.start} min`;
        
        let rowClass = "";
        let focusArea = slot.label;
        let activity = "-";
        let status = "Flexible Block";

        if (slot.type === 'study') {
            rowClass = "study-row";
            focusArea = `
                <div class="subject-cell">
                    <span class="color-dot" style="background-color: var(--priority-${slot.priority})"></span>
                    <span>${slot.subject}</span>
                </div>
            `;
            activity = `
                <div class="activity-desc">${slot.method}</div>
                <div class="activity-method"><i class="fa-solid fa-bolt"></i> Active Study Window</div>
            `;
            status = `<span class="subject-badge ${slot.priority}">${slot.priority.toUpperCase()} FOCUS</span>`;
        } else if (slot.type === 'commitment') {
            rowClass = "commitment-row";
            focusArea = `<strong>${slot.label}</strong>`;
            activity = `<div class="activity-desc">Fixed Appointment</div>`;
            status = `<span class="subject-badge commitment">FIXED</span>`;
        } else if (slot.type === 'break') {
            rowClass = "break-row";
            focusArea = `<span class="color-dot" style="background: var(--break-text)"></span> Relax / Move Around`;
            activity = `<div class="activity-desc">Hydrate, Stretch, Walk</div>`;
            status = `<span class="subject-badge break">BREAK</span>`;
        } else if (slot.type === 'buffer') {
            rowClass = "buffer-row";
            focusArea = `<em>${slot.label}</em>`;
            activity = `<div class="activity-desc">Buffer / Subject Catch-up</div>`;
            status = `<span class="subject-badge buffer">BUFFER</span>`;
        }

        // Add quote notice row if needed
        if (slot.showQuoteBefore) {
            tbody.innerHTML += `
                <tr class="quote-notice-row">
                    <td colspan="5" style="padding: 8px 20px; background: rgba(99, 102, 241, 0.05); text-align: center; font-style: italic; color: var(--primary); font-size: 13px; font-weight: 500;">
                        <i class="fa-solid fa-lightbulb"></i> "${slot.showQuoteBefore}"
                    </td>
                </tr>
            `;
        }

        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td><strong>${timeRange}</strong></td>
                <td><span class="duration-tag">${duration}</span></td>
                <td>${focusArea}</td>
                <td>${activity}</td>
                <td class="status-cell">${status}</td>
            </tr>
        `;
    });
}

// --- RENDER WEEKLY OVERVIEW ---
function calculateWeeklyHours(subjs) {
    return subjs.reduce((total, s) => total + s.hours, 0);
}

function renderWeeklyGrid(subjs, lightDays, targetHours) {
    const totalWeeklyTarget = calculateWeeklyHours(subjs);
    document.getElementById("weekly-total-hours").textContent = `${totalWeeklyTarget} hrs`;

    // Map light days indices to text
    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const priorityDays = daysArr.filter((d, index) => !lightDays.includes(index) && index !== 0); // exclude Sunday and light days
    document.getElementById("weekly-high-priority-days").textContent = priorityDays.join(", ");

    const container = document.getElementById("weekly-grid-body");
    container.innerHTML = "";

    // Find max hours to calculate percentage width
    const maxHours = Math.max(...subjs.map(s => s.hours), 1);

    subjs.forEach(s => {
        const percentage = Math.min(100, Math.round((s.hours / maxHours) * 100));
        let priorityColor = "var(--priority-high)";
        if (s.priority === 'medium') priorityColor = "var(--priority-med)";
        if (s.priority === 'low') priorityColor = "var(--priority-low)";

        container.innerHTML += `
            <div class="weekly-subject-row">
                <div class="weekly-subject-info">
                    <div class="weekly-subject-name">
                        <span class="color-dot" style="background-color: ${priorityColor}"></span>
                        <span>${s.name}</span>
                    </div>
                    <div class="weekly-subject-meta">Priority: ${s.priority.toUpperCase()} &bull; Recommended Session: Active Recall</div>
                </div>
                <div class="weekly-progress-bar-container">
                    <div class="weekly-progress-bar" style="width: ${percentage}%; background-color: ${priorityColor}"></div>
                </div>
                <div class="weekly-hours-count">${s.hours} hrs/wk</div>
            </div>
        `;
    });
}

// --- RENDER SPACED REPETITION PLAN ---
function renderSpacedRepetition(subjs, intervalsStr) {
    const grid = document.getElementById("spaced-rep-grid");
    grid.innerHTML = "";

    const intervals = intervalsStr.split(',').map(s => s.trim());

    subjs.forEach(s => {
        let priorityColor = "var(--priority-high)";
        if (s.priority === 'medium') priorityColor = "var(--priority-med)";
        if (s.priority === 'low') priorityColor = "var(--priority-low)";

        let cardsHtml = "";
        intervals.forEach((interval, step) => {
            let task = "Review summary notes and run a flashcard sweep.";
            if (interval.includes("3d")) {
                task = "Attempt 3-5 high-difficulty practice problems.";
            } else if (interval.includes("7d")) {
                task = "Explain core concepts to an imaginary audience (Feynman).";
            } else if (interval.includes("14d")) {
                task = "Simulate mock exam blocks or timed quizzes.";
            }
            
            cardsHtml += `
                <div class="spaced-interval-step">
                    <span class="spaced-interval-badge">Interval: ${interval}</span>
                    <span class="spaced-interval-method">${task}</span>
                </div>
            `;
        });

        grid.innerHTML += `
            <div class="spaced-card">
                <div class="spaced-card-header">
                    <div class="spaced-subject-title">
                        <span class="color-dot" style="background-color: ${priorityColor}"></span>
                        <span>${s.name}</span>
                    </div>
                    <small style="color: var(--text-muted)">Priority: ${s.priority.toUpperCase()}</small>
                </div>
                <div class="spaced-card-body">
                    ${cardsHtml}
                </div>
            </div>
        `;
    });
}

function generateMilestoneDetails(subjectName, intervalsStr) {
    const intervals = intervalsStr.split(',').map(s => s.trim());
    return intervals.map(interval => {
        let action = "Flashcard recall check";
        if (interval.includes("3d")) action = "Practice problems sprint";
        else if (interval.includes("7d")) action = "Feynman presentation / summarization";
        return {
            interval: interval,
            action: action
        };
    });
}

// --- COPY & EXPORT UTILS ---
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => {
        toast.classList.add("hidden");
    }, 2500);
}

function exportJSON() {
    copyJSONText();
}

function copyJSONText() {
    const codeArea = document.getElementById("json-output").textContent;
    navigator.clipboard.writeText(codeArea).then(() => {
        showToast("JSON Config copied to clipboard!");
    }, () => {
        showToast("Failed to copy JSON.");
    });
}
