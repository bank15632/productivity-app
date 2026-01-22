// ============================================
// CONFIGURATION - แก้ไขค่าเหล่านี้ให้ตรงกับของคุณ
// ============================================
const CONFIG = {
  SHEET_ID: '1JfEnsd3glkd9_qt3o-ccTWW9zrhm__aLXaD3D8spvyo', // เอาจาก URL ของ Google Sheet
  FOLDERS: {
    ATTACHMENTS: '1U3E1t3TBffzTxzLV66i67VAgrMoc_zvJ',
    IMAGES: '1KVeShY9tDtbYcqpEik7AAtKQNnzwunJy',
    DOCUMENTS: '1hENR5H-GFPg5YAeD6ADeK03BHqZ9Po65',
    ARCHIVES: '1k7o7WmJDeY634llPyYfpB1WNpbioVmLL',
    BACKUPS: '1mnwqxXgFhJD0PRdaCBCfLZPagKkyinsK'
  },
  LINE_CHANNEL_ACCESS_TOKEN: 'YOUR_LINE_TOKEN' // จะได้จาก LINE Developers Console
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SHEET_ID);
}

function getSheet(tabName) {
  return getSpreadsheet().getSheetByName(tabName);
}

function generateId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
}

function sheetToJson(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(row => row.id); // กรองแถวที่ไม่มี ID ออก
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ============================================
// API ENDPOINTS - GET
// ============================================

function doGet(e) {
  const action = e.parameter.action;
  
  // Check if there's a payload parameter (for POST-like operations via GET)
  let data = {};
  if (e.parameter.payload) {
    try {
      data = JSON.parse(e.parameter.payload);
    } catch(err) {
      // If parsing fails, use empty object
    }
  }
  
  try {
    let result;
    
    switch(action) {
      // GET operations
      case 'getAllProjects':
        result = getAllProjects();
        break;
      case 'getAllTasks':
        ensureHasSubtasksColumn(); // ตรวจสอบและเพิ่ม column ถ้าไม่มี
        result = getAllTasks();
        break;
      case 'getAllNotes':
        result = getAllNotes();
        break;
      case 'getTasksByProject':
        result = getTasksByProject(e.parameter.projectId);
        break;
      case 'getTasksByDate':
        result = getTasksByDate(e.parameter.date);
        break;
      case 'getNote':
        result = getNote(e.parameter.noteId);
        break;
      case 'searchTasks':
        result = searchTasks(e.parameter.query);
        break;
      case 'getTemplates':
        result = getTemplates();
        break;
      case 'getStorageStats':
        result = getStorageStats();
        break;
      case 'getWeeklyAnalytics':
        result = getWeeklyAnalytics();
        break;
      case 'getAllSubProjects':
        result = getAllSubProjects();
        break;
      case 'getSubProjectsByProject':
        result = getSubProjectsByProject(e.parameter.projectId);
        break;
      case 'getSubTasksByTask':
        result = getSubTasksByTask(e.parameter.taskId);
        break;
      
      // POST-like operations (via payload parameter)
      case 'createProject':
        result = createProject(data);
        break;
      case 'updateProject':
        result = updateProject(data);
        break;
      case 'deleteProject':
        result = deleteProject(data.projectId);
        break;
      case 'createTask':
        result = createTask(data);
        break;
      case 'updateTask':
        result = updateTask(data);
        break;
      case 'deleteTask':
        result = deleteTask(data.taskId);
        break;
      case 'createNote':
        result = createNote(data);
        break;
      case 'updateNote':
        result = updateNote(data);
        break;
      case 'deleteNote':
        result = deleteNote(data.noteId);
        break;
      case 'archiveProject':
        result = archiveProject(data.projectId);
        break;
      case 'downloadAndDeleteProject':
        result = downloadAndDeleteProject(data.projectId);
        break;
      case 'exportAllData':
        result = exportAllData();
        break;
      case 'importData':
        result = importData(data.jsonData);
        break;
      case 'createBackup':
        result = createDailyBackup();
        break;
      case 'createFromTemplate':
        result = createFromTemplate(data.templateId, data.projectId, data.startDate);
        break;
      case 'updateTimeSpent':
        result = updateTimeSpent(data.taskId, data.minutes);
        break;
      case 'createSubProject':
        result = createSubProject(data);
        break;
      case 'updateSubProject':
        result = updateSubProject(data);
        break;
      case 'deleteSubProject':
        result = deleteSubProject(data.subProjectId);
        break;
      case 'createSubTask':
        result = createSubTask(data);
        break;
      case 'updateSubTask':
        result = updateSubTask(data);
        break;
      case 'deleteSubTask':
        result = deleteSubTask(data.subTaskId);
        break;
      case 'toggleSubTaskStatus':
        result = toggleSubTaskStatus(data.subTaskId);
        break;
        
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ดึงโปรเจกต์ทั้งหมด
function getAllProjects() {
  const sheet = getSheet('Projects');
  return sheetToJson(sheet);
}

// ดึง Tasks ทั้งหมด
function getAllTasks() {
  const sheet = getSheet('Tasks');
  return sheetToJson(sheet);
}

// ดึง Notes ทั้งหมด
function getAllNotes() {
  const sheet = getSheet('Notes');
  return sheetToJson(sheet);
}

// ดึง Tasks ตาม Project
function getTasksByProject(projectId) {
  const tasks = getAllTasks();
  return tasks.filter(task => task.project_id === projectId);
}

// ดึง Tasks ตามวันที่
function getTasksByDate(date) {
  const tasks = getAllTasks();
  return tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const searchDate = new Date(date);
    return formatDate(dueDate) === formatDate(searchDate);
  });
}

// ดึง Note
function getNote(noteId) {
  const sheet = getSheet('Notes');
  const notes = sheetToJson(sheet);
  return notes.find(note => note.id === noteId) || null;
}

// ค้นหา Tasks
function searchTasks(query) {
  const tasks = getAllTasks();
  const lowerQuery = query.toLowerCase();
  
  return tasks.filter(task => 
    (task.title && task.title.toLowerCase().includes(lowerQuery)) ||
    (task.description && task.description.toLowerCase().includes(lowerQuery)) ||
    (task.tags && task.tags.toLowerCase().includes(lowerQuery))
  );
}

// ============================================
// API ENDPOINTS - POST
// ============================================

function doPost(e) {
  const action = e.parameter.action;
  let data = {};
  
  try {
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
  } catch(err) {
    // ถ้า parse ไม่ได้ ให้ใช้ค่าว่าง
  }
  
  try {
    let result;
    
    switch(action) {
      case 'createProject':
        result = createProject(data);
        break;
      case 'updateProject':
        result = updateProject(data);
        break;
      case 'deleteProject':
        result = deleteProject(data.projectId);
        break;
      case 'createTask':
        result = createTask(data);
        break;
      case 'updateTask':
        result = updateTask(data);
        break;
      case 'deleteTask':
        result = deleteTask(data.taskId);
        break;
      case 'createNote':
        result = createNote(data);
        break;
      case 'updateNote':
        result = updateNote(data);
        break;
      case 'deleteNote':
        result = deleteNote(data.noteId);
        break;
      case 'archiveProject':
        result = archiveProject(data.projectId);
        break;
      case 'downloadAndDeleteProject':
        result = downloadAndDeleteProject(data.projectId);
        break;
      case 'exportAllData':
        result = exportAllData();
        break;
      case 'importData':
        result = importData(data.jsonData);
        break;
      case 'createBackup':
        result = createDailyBackup();
        break;
      case 'createFromTemplate':
        result = createFromTemplate(data.templateId, data.projectId, data.startDate);
        break;
      case 'updateTimeSpent':
        result = updateTimeSpent(data.taskId, data.minutes);
        break;
      case 'createSubProject':
        result = createSubProject(data);
        break;
      case 'updateSubProject':
        result = updateSubProject(data);
        break;
      case 'deleteSubProject':
        result = deleteSubProject(data.subProjectId);
        break;
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// PROJECT FUNCTIONS
// ============================================

function createProject(data) {
  const sheet = getSheet('Projects');
  const id = generateId('P');
  const timestamp = new Date();
  
  // สร้าง Folder ใน Drive (ถ้าต้องการ)
  let folderId = '';
  try {
    const parentFolder = DriveApp.getFolderById(CONFIG.FOLDERS.ATTACHMENTS);
    const projectFolder = parentFolder.createFolder(data.name);
    folderId = projectFolder.getId();
  } catch(e) {
    // ถ้าสร้าง folder ไม่ได้ ให้ข้ามไป
  }
  
  sheet.appendRow([
    id,
    data.name || '',
    data.description || '',
    'Active',
    data.priority || 'Medium',
    folderId,
    timestamp,
    timestamp,
    '',
    data.category || ''
  ]);
  
  return { success: true, id: id, folderId: folderId };
}

function updateProject(data) {
  const sheet = getSheet('Projects');
  const projects = sheetToJson(sheet);
  const projectIndex = projects.findIndex(p => p.id === data.id);

  if (projectIndex === -1) {
    return { error: 'Project not found' };
  }

  const rowIndex = projectIndex + 2;
  const timestamp = new Date();

  if (data.name !== undefined) sheet.getRange(rowIndex, 2).setValue(data.name);
  if (data.description !== undefined) sheet.getRange(rowIndex, 3).setValue(data.description);
  if (data.status !== undefined) {
    sheet.getRange(rowIndex, 4).setValue(data.status);
    if (data.status === 'Done') {
      sheet.getRange(rowIndex, 9).setValue(timestamp);
    } else {
      sheet.getRange(rowIndex, 9).setValue('');
    }
  }
  if (data.priority !== undefined) sheet.getRange(rowIndex, 5).setValue(data.priority);
  if (data.category !== undefined) sheet.getRange(rowIndex, 10).setValue(data.category);

  sheet.getRange(rowIndex, 8).setValue(timestamp);

  return { success: true };
}

function archiveProject(projectId) {
  const projectSheet = getSheet('Projects');
  const projects = sheetToJson(projectSheet);
  const projectIndex = projects.findIndex(p => p.id === projectId);
  
  if (projectIndex === -1) {
    return { error: 'Project not found' };
  }
  
  // อัพเดทสถานะเป็น Archived
  const rowIndex = projectIndex + 2; // +2 เพราะ header + zero-index
  projectSheet.getRange(rowIndex, 4).setValue('Archived');
  projectSheet.getRange(rowIndex, 8).setValue(new Date());
  
  return { success: true };
}

function deleteProject(projectId) {
  const projectSheet = getSheet('Projects');
  const tasksSheet = getSheet('Tasks');
  const notesSheet = getSheet('Notes');

  const projects = sheetToJson(projectSheet);
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    return { error: 'Project not found' };
  }

  projectSheet.deleteRow(projectIndex + 2);

  const allTasks = sheetToJson(tasksSheet);
  for (let i = allTasks.length - 1; i >= 0; i--) {
    if (allTasks[i].project_id === projectId) {
      tasksSheet.deleteRow(i + 2);
    }
  }

  const allNotes = sheetToJson(notesSheet);
  for (let i = allNotes.length - 1; i >= 0; i--) {
    if (allNotes[i].project_id === projectId) {
      notesSheet.deleteRow(i + 2);
    }
  }

  return { success: true };
}

function downloadAndDeleteProject(projectId) {
  const projectSheet = getSheet('Projects');
  const tasksSheet = getSheet('Tasks');
  const notesSheet = getSheet('Notes');
  
  const projects = sheetToJson(projectSheet);
  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    return { error: 'Project not found' };
  }
  
  // ดึงข้อมูลที่เกี่ยวข้อง
  const tasks = sheetToJson(tasksSheet).filter(t => t.project_id === projectId);
  const notes = sheetToJson(notesSheet).filter(n => n.project_id === projectId);
  
  // สร้างไฟล์ Archive
  const archiveData = {
    project: project,
    tasks: tasks,
    notes: notes,
    archived_at: new Date().toISOString()
  };
  
  let downloadUrl = '';
  try {
    const archiveFolder = DriveApp.getFolderById(CONFIG.FOLDERS.ARCHIVES);
    const fileName = `${project.name}_${new Date().getTime()}.json`;
    const jsonFile = archiveFolder.createFile(fileName, JSON.stringify(archiveData, null, 2));
    downloadUrl = jsonFile.getUrl();
  } catch(e) {
    // ถ้าสร้างไฟล์ไม่ได้
  }
  
  // ลบ Project
  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex !== -1) {
    projectSheet.deleteRow(projectIndex + 2);
  }
  
  // ลบ Tasks (ต้องลบจากล่างขึ้นบน)
  const allTasks = sheetToJson(tasksSheet);
  for (let i = allTasks.length - 1; i >= 0; i--) {
    if (allTasks[i].project_id === projectId) {
      tasksSheet.deleteRow(i + 2);
    }
  }
  
  // ลบ Notes
  const allNotes = sheetToJson(notesSheet);
  for (let i = allNotes.length - 1; i >= 0; i--) {
    if (allNotes[i].project_id === projectId) {
      notesSheet.deleteRow(i + 2);
    }
  }
  
  return { 
    success: true, 
    downloadUrl: downloadUrl
  };
}

// ============================================
// SUB-PROJECT FUNCTIONS
// ============================================

// ดึง SubProjects ทั้งหมด
function getAllSubProjects() {
  const sheet = getSheet('SubProjects');
  if (!sheet) {
    // สร้าง Sheet ใหม่ถ้ายังไม่มี
    createSubProjectsSheet();
    return [];
  }
  return sheetToJson(sheet);
}

// ดึง SubProjects ตาม Project
function getSubProjectsByProject(projectId) {
  const subProjects = getAllSubProjects();
  return subProjects.filter(sp => sp.project_id === projectId);
}

// สร้าง SubProjects Sheet ถ้ายังไม่มี
function createSubProjectsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('SubProjects');
  if (!sheet) {
    sheet = ss.insertSheet('SubProjects');
    sheet.appendRow(['id', 'name', 'project_id', 'description', 'status', 'created_at', 'updated_at']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  return sheet;
}

// สร้าง SubProject ใหม่
function createSubProject(data) {
  let sheet = getSheet('SubProjects');
  if (!sheet) {
    sheet = createSubProjectsSheet();
  }
  
  const id = generateId('SP');
  const timestamp = new Date();
  
  sheet.appendRow([
    id,
    data.name || '',
    data.project_id || '',
    data.description || '',
    data.status || 'Active',
    timestamp,
    timestamp
  ]);
  
  return { success: true, id: id };
}

// อัพเดท SubProject
function updateSubProject(data) {
  const sheet = getSheet('SubProjects');
  if (!sheet) {
    return { error: 'SubProjects sheet not found' };
  }
  
  const subProjects = sheetToJson(sheet);
  const spIndex = subProjects.findIndex(sp => sp.id === data.id);
  
  if (spIndex === -1) {
    return { error: 'SubProject not found' };
  }
  
  const rowIndex = spIndex + 2;
  const timestamp = new Date();
  
  if (data.name !== undefined) sheet.getRange(rowIndex, 2).setValue(data.name);
  if (data.project_id !== undefined) sheet.getRange(rowIndex, 3).setValue(data.project_id);
  if (data.description !== undefined) sheet.getRange(rowIndex, 4).setValue(data.description);
  if (data.status !== undefined) sheet.getRange(rowIndex, 5).setValue(data.status);
  
  sheet.getRange(rowIndex, 7).setValue(timestamp);
  
  return { success: true };
}

// ลบ SubProject
function deleteSubProject(subProjectId) {
  const sheet = getSheet('SubProjects');
  if (!sheet) {
    return { error: 'SubProjects sheet not found' };
  }
  
  const subProjects = sheetToJson(sheet);
  const spIndex = subProjects.findIndex(sp => sp.id === subProjectId);
  
  if (spIndex === -1) {
    return { error: 'SubProject not found' };
  }
  
  sheet.deleteRow(spIndex + 2);
  return { success: true };
}

// ============================================
// SUB-TASK FUNCTIONS
// ============================================

// สร้าง SubTasks Sheet ถ้ายังไม่มี
function createSubTasksSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('SubTasks');
  if (!sheet) {
    sheet = ss.insertSheet('SubTasks');
    sheet.appendRow(['id', 'parent_task_id', 'title', 'status', 'created_at', 'updated_at', 'completed_at']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  return sheet;
}

// ดึง SubTasks ตาม Task
function getSubTasksByTask(taskId) {
  let sheet = getSheet('SubTasks');
  if (!sheet) {
    sheet = createSubTasksSheet();
    return [];
  }
  const subTasks = sheetToJson(sheet);
  return subTasks.filter(st => st.parent_task_id === taskId);
}

// สร้าง SubTask ใหม่
function createSubTask(data) {
  let sheet = getSheet('SubTasks');
  if (!sheet) {
    sheet = createSubTasksSheet();
  }
  
  const id = generateId('ST');
  const timestamp = new Date();
  
  sheet.appendRow([
    id,
    data.parent_task_id || '',
    data.title || '',
    'ToDo',
    timestamp,
    timestamp,
    ''
  ]);
  
  // อัพเดท parent task has_subtasks = true
  if (data.parent_task_id) {
    updateTaskHasSubtasks(data.parent_task_id, true);
  }
  
  return { success: true, id: id };
}

// อัพเดท SubTask
function updateSubTask(data) {
  const sheet = getSheet('SubTasks');
  if (!sheet) {
    return { error: 'SubTasks sheet not found' };
  }
  
  const subTasks = sheetToJson(sheet);
  const stIndex = subTasks.findIndex(st => st.id === data.id);
  
  if (stIndex === -1) {
    return { error: 'SubTask not found' };
  }
  
  const rowIndex = stIndex + 2;
  const timestamp = new Date();
  
  if (data.title !== undefined) sheet.getRange(rowIndex, 3).setValue(data.title);
  if (data.status !== undefined) {
    sheet.getRange(rowIndex, 4).setValue(data.status);
    if (data.status === 'Done') {
      sheet.getRange(rowIndex, 7).setValue(timestamp);
    } else {
      sheet.getRange(rowIndex, 7).setValue('');
    }
  }
  
  sheet.getRange(rowIndex, 6).setValue(timestamp);
  
  return { success: true };
}

// ลบ SubTask
function deleteSubTask(subTaskId) {
  const sheet = getSheet('SubTasks');
  if (!sheet) {
    return { error: 'SubTasks sheet not found' };
  }
  
  const subTasks = sheetToJson(sheet);
  const stIndex = subTasks.findIndex(st => st.id === subTaskId);
  
  if (stIndex === -1) {
    return { error: 'SubTask not found' };
  }
  
  const parentTaskId = subTasks[stIndex].parent_task_id;
  sheet.deleteRow(stIndex + 2);
  
  // เช็คว่ายังมี SubTask เหลือไหม ถ้าไม่มีให้ update has_subtasks = false
  const remainingSubTasks = getSubTasksByTask(parentTaskId);
  if (remainingSubTasks.length === 0) {
    updateTaskHasSubtasks(parentTaskId, false);
  }
  
  return { success: true };
}

// Toggle SubTask status และ auto-complete parent
function toggleSubTaskStatus(subTaskId) {
  const sheet = getSheet('SubTasks');
  if (!sheet) {
    return { error: 'SubTasks sheet not found' };
  }
  
  const subTasks = sheetToJson(sheet);
  const stIndex = subTasks.findIndex(st => st.id === subTaskId);
  
  if (stIndex === -1) {
    return { error: 'SubTask not found' };
  }
  
  const rowIndex = stIndex + 2;
  const timestamp = new Date();
  const subTask = subTasks[stIndex];
  const newStatus = subTask.status === 'Done' ? 'ToDo' : 'Done';
  
  sheet.getRange(rowIndex, 4).setValue(newStatus);
  sheet.getRange(rowIndex, 6).setValue(timestamp);
  
  if (newStatus === 'Done') {
    sheet.getRange(rowIndex, 7).setValue(timestamp);
  } else {
    sheet.getRange(rowIndex, 7).setValue('');
  }
  
  // เช็ค auto-complete parent task
  const parentTaskId = subTask.parent_task_id;
  const allSubTasks = getSubTasksByTask(parentTaskId);
  // Re-fetch to get updated status
  const updatedSubTasks = allSubTasks.map(st => 
    st.id === subTaskId ? {...st, status: newStatus} : st
  );
  
  const completedCount = updatedSubTasks.filter(st => st.status === 'Done').length;
  const totalCount = updatedSubTasks.length;
  
  // ถ้าครบ 100% ให้เปลี่ยน parent task เป็น Done
  if (completedCount === totalCount && totalCount > 0) {
    updateTask({ id: parentTaskId, status: 'Done' });
  }
  
  return { 
    success: true, 
    newStatus: newStatus,
    progress: {
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    }
  };
}

// Helper: อัพเดท has_subtasks ของ Task
function updateTaskHasSubtasks(taskId, hasSubtasks) {
  const sheet = getSheet('Tasks');
  const tasks = sheetToJson(sheet);
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) return;
  
  // Column 22 = has_subtasks (เพิ่มใหม่)
  const rowIndex = taskIndex + 2;
  sheet.getRange(rowIndex, 22).setValue(hasSubtasks);
  sheet.getRange(rowIndex, 18).setValue(new Date()); // updated_at
}

// ============================================
// TASK FUNCTIONS
// ============================================

// Helper: ตรวจสอบและเพิ่ม column has_subtasks ถ้ายังไม่มี
function ensureHasSubtasksColumn() {
  const sheet = getSheet('Tasks');
  if (!sheet) return;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const hasSubtasksIndex = headers.indexOf('has_subtasks');
  
  if (hasSubtasksIndex === -1) {
    // เพิ่ม column ใหม่
    const lastCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, lastCol).setValue('has_subtasks');
  }
}

function createTask(data) {
  const sheet = getSheet('Tasks');
  const id = generateId('T');
  const timestamp = new Date();
  
  sheet.appendRow([
    id,
    data.title || '',
    data.description || '',
    data.project_id || '',
    data.status || 'ToDo',
    data.priority || 'Medium',
    data.due_date || '',
    data.due_time || '',
    data.time_estimate || 0,
    0, // time_spent
    data.linked_tasks || '',
    data.tags || '',
    data.note_id || '',
    data.is_recurring || false,
    data.recurring_pattern || '',
    data.parent_task_id || '',
    timestamp,
    timestamp,
    '',
    data.created_from || 'Web',
    data.location_url || '', // Google Maps URL สำหรับการนัดหมาย
    data.has_subtasks || false // Column 22: has_subtasks flag
  ]);
  
  // อัพเดท Analytics
  updateAnalytics('tasks_created');
  
  return { success: true, id: id };
}

function updateTask(data) {
  const sheet = getSheet('Tasks');
  const tasks = sheetToJson(sheet);
  const taskIndex = tasks.findIndex(task => task.id === data.id);
  
  if (taskIndex === -1) {
    return { error: 'Task not found' };
  }
  
  const rowIndex = taskIndex + 2;
  const timestamp = new Date();
  
  // อัพเดทแต่ละ column ที่ส่งมา
  if (data.title !== undefined) sheet.getRange(rowIndex, 2).setValue(data.title);
  if (data.description !== undefined) sheet.getRange(rowIndex, 3).setValue(data.description);
  if (data.project_id !== undefined) sheet.getRange(rowIndex, 4).setValue(data.project_id);
  if (data.status !== undefined) {
    sheet.getRange(rowIndex, 5).setValue(data.status);
    
    // ถ้า status = Done ให้เซ็ต completed_at
    if (data.status === 'Done') {
      sheet.getRange(rowIndex, 19).setValue(timestamp);
      updateAnalytics('tasks_completed');
    }
  }
  if (data.priority !== undefined) sheet.getRange(rowIndex, 6).setValue(data.priority);
  if (data.due_date !== undefined) sheet.getRange(rowIndex, 7).setValue(data.due_date);
  if (data.due_time !== undefined) sheet.getRange(rowIndex, 8).setValue(data.due_time);
  if (data.time_estimate !== undefined) sheet.getRange(rowIndex, 9).setValue(data.time_estimate);
  if (data.time_spent !== undefined) sheet.getRange(rowIndex, 10).setValue(data.time_spent);
  if (data.tags !== undefined) sheet.getRange(rowIndex, 12).setValue(data.tags);
  if (data.location_url !== undefined) sheet.getRange(rowIndex, 21).setValue(data.location_url);
  
  // อัพเดท updated_at
  sheet.getRange(rowIndex, 18).setValue(timestamp);
  
  return { success: true };
}

function deleteTask(taskId) {
  const sheet = getSheet('Tasks');
  const tasks = sheetToJson(sheet);
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) {
    return { error: 'Task not found' };
  }
  
  sheet.deleteRow(taskIndex + 2);
  return { success: true };
}

function updateTimeSpent(taskId, minutes) {
  const sheet = getSheet('Tasks');
  const tasks = sheetToJson(sheet);
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) {
    return { error: 'Task not found' };
  }
  
  const rowIndex = taskIndex + 2;
  const currentTimeSpent = sheet.getRange(rowIndex, 10).getValue() || 0;
  sheet.getRange(rowIndex, 10).setValue(currentTimeSpent + minutes);
  sheet.getRange(rowIndex, 18).setValue(new Date()); // updated_at
  
  return { success: true };
}

// ============================================
// NOTE FUNCTIONS
// ============================================

function createNote(data) {
  const sheet = getSheet('Notes');
  const id = generateId('N');
  const timestamp = new Date();
  
  sheet.appendRow([
    id,
    data.title || '',
    data.content || '',
    data.tags || '',
    data.linked_notes || '',
    data.linked_tasks || '',
    data.project_id || '',
    timestamp,
    timestamp
  ]);
  
  return { success: true, id: id };
}

function updateNote(data) {
  const sheet = getSheet('Notes');
  const notes = sheetToJson(sheet);
  const noteIndex = notes.findIndex(note => note.id === data.id);
  
  if (noteIndex === -1) {
    return { error: 'Note not found' };
  }
  
  const rowIndex = noteIndex + 2;
  const timestamp = new Date();
  
  if (data.title !== undefined) sheet.getRange(rowIndex, 2).setValue(data.title);
  if (data.content !== undefined) sheet.getRange(rowIndex, 3).setValue(data.content);
  if (data.tags !== undefined) sheet.getRange(rowIndex, 4).setValue(data.tags);
  if (data.linked_notes !== undefined) sheet.getRange(rowIndex, 5).setValue(data.linked_notes);
  if (data.linked_tasks !== undefined) sheet.getRange(rowIndex, 6).setValue(data.linked_tasks);
  
  sheet.getRange(rowIndex, 9).setValue(timestamp);
  
  return { success: true };
}

function deleteNote(noteId) {
  const sheet = getSheet('Notes');
  const notes = sheetToJson(sheet);
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) {
    return { error: 'Note not found' };
  }
  
  sheet.deleteRow(noteIndex + 2);
  return { success: true };
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

function updateAnalytics(metric) {
  const sheet = getSheet('Analytics');
  const today = formatDate(new Date());
  
  const data = sheetToJson(sheet);
  let todayRowIndex = -1;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i].date && formatDate(new Date(data[i].date)) === today) {
      todayRowIndex = i + 2;
      break;
    }
  }
  
  if (todayRowIndex === -1) {
    // สร้างแถวใหม่สำหรับวันนี้
    sheet.appendRow([today, 0, 0, 0, 0, '']);
    todayRowIndex = sheet.getLastRow();
  }
  
  // อัพเดท metric ที่ต้องการ
  if (metric === 'tasks_created') {
    const current = sheet.getRange(todayRowIndex, 2).getValue() || 0;
    sheet.getRange(todayRowIndex, 2).setValue(current + 1);
  } else if (metric === 'tasks_completed') {
    const current = sheet.getRange(todayRowIndex, 3).getValue() || 0;
    sheet.getRange(todayRowIndex, 3).setValue(current + 1);
  }
}

function getWeeklyAnalytics() {
  const sheet = getSheet('Analytics');
  const data = sheetToJson(sheet);
  
  // ดึงข้อมูล 7 วันล่าสุด
  const today = new Date();
  const result = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    
    const dayData = data.find(d => d.date && formatDate(new Date(d.date)) === dateStr);
    
    result.push({
      date: dateStr,
      created: dayData ? (dayData.tasks_created || 0) : 0,
      completed: dayData ? (dayData.tasks_completed || 0) : 0
    });
  }
  
  return result;
}

function getStorageStats() {
  const projects = getAllProjects();
  const tasks = getAllTasks();
  
  let attachments = [];
  try {
    const attachmentSheet = getSheet('Attachments');
    if (attachmentSheet) {
      attachments = sheetToJson(attachmentSheet);
    }
  } catch(e) {}
  
  let totalFileSize = 0;
  attachments.forEach(att => {
    totalFileSize += att.file_size || 0;
  });
  
  return {
    projects: projects.length,
    tasks: tasks.length,
    attachments: attachments.length,
    total_file_size: totalFileSize,
    total_file_size_mb: (totalFileSize / 1024 / 1024).toFixed(2)
  };
}

// ============================================
// BACKUP FUNCTIONS
// ============================================

function createDailyBackup() {
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
  
  try {
    const ss = getSpreadsheet();
    const backupFolder = DriveApp.getFolderById(CONFIG.FOLDERS.BACKUPS);
    
    const backupFile = ss.copy(`Backup_${timestamp}`);
    const file = DriveApp.getFileById(backupFile.getId());
    backupFolder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    
    // ลบ backup ที่เก่ากว่า 30 วัน
    cleanupOldBackups(30);
    
    return { success: true, backupId: backupFile.getId() };
  } catch(e) {
    return { error: e.message };
  }
}

function cleanupOldBackups(daysToKeep) {
  try {
    const backupFolder = DriveApp.getFolderById(CONFIG.FOLDERS.BACKUPS);
    const files = backupFolder.getFiles();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let deletedCount = 0;
    
    while (files.hasNext()) {
      const file = files.next();
      const createdDate = file.getDateCreated();
      
      if (createdDate < cutoffDate) {
        file.setTrashed(true);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch(e) {
    return 0;
  }
}

function exportAllData() {
  const data = {
    exported_at: new Date().toISOString(),
    projects: getAllProjects(),
    tasks: getAllTasks(),
    notes: getAllNotes()
  };
  
  try {
    const backupFolder = DriveApp.getFolderById(CONFIG.FOLDERS.BACKUPS);
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
    const fileName = `Full_Export_${timestamp}.json`;
    
    const file = backupFolder.createFile(fileName, JSON.stringify(data, null, 2));
    
    return {
      success: true,
      fileId: file.getId(),
      downloadUrl: file.getUrl()
    };
  } catch(e) {
    return { error: e.message };
  }
}

function importData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    // Import Projects
    if (data.projects && data.projects.length > 0) {
      const projectSheet = getSheet('Projects');
      data.projects.forEach(project => {
        projectSheet.appendRow([
          project.id,
          project.name,
          project.description,
          project.status,
          project.priority,
          project.folder_id,
          project.created_at,
          project.updated_at,
          project.completed_at
        ]);
      });
    }
    
    // Import Tasks
    if (data.tasks && data.tasks.length > 0) {
      const taskSheet = getSheet('Tasks');
      data.tasks.forEach(task => {
        taskSheet.appendRow([
          task.id,
          task.title,
          task.description,
          task.project_id,
          task.status,
          task.priority,
          task.due_date,
          task.due_time,
          task.time_estimate,
          task.time_spent,
          task.linked_tasks,
          task.tags,
          task.note_id,
          task.is_recurring,
          task.recurring_pattern,
          task.parent_task_id,
          task.created_at,
          task.updated_at,
          task.completed_at,
          task.created_from
        ]);
      });
    }
    
    // Import Notes
    if (data.notes && data.notes.length > 0) {
      const noteSheet = getSheet('Notes');
      data.notes.forEach(note => {
        noteSheet.appendRow([
          note.id,
          note.title,
          note.content,
          note.tags,
          note.linked_notes,
          note.linked_tasks,
          note.project_id,
          note.created_at,
          note.updated_at
        ]);
      });
    }
    
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    return { error: 'Import failed: ' + error.message };
  }
}

// ============================================
// TEMPLATES
// ============================================

function getTemplates() {
  return [
    {
      id: 'video_production',
      name: 'Video Production',
      tasks: [
        { title: 'Research topic', time_estimate: 120, priority: 'High' },
        { title: 'Write script', time_estimate: 180, priority: 'High' },
        { title: 'Record video', time_estimate: 240, priority: 'High' },
        { title: 'Edit video', time_estimate: 300, priority: 'High' },
        { title: 'Create thumbnail', time_estimate: 60, priority: 'Medium' },
        { title: 'Upload and publish', time_estimate: 30, priority: 'Medium' }
      ]
    },
    {
      id: 'blog_post',
      name: 'Blog Post',
      tasks: [
        { title: 'Research topic', time_estimate: 90, priority: 'High' },
        { title: 'Create outline', time_estimate: 30, priority: 'High' },
        { title: 'Write first draft', time_estimate: 180, priority: 'High' },
        { title: 'Edit and revise', time_estimate: 90, priority: 'High' },
        { title: 'Add images', time_estimate: 60, priority: 'Medium' },
        { title: 'Publish', time_estimate: 15, priority: 'Low' }
      ]
    },
    {
      id: 'weekly_review',
      name: 'Weekly Review',
      tasks: [
        { title: 'Review completed tasks', time_estimate: 30, priority: 'Medium' },
        { title: 'Update project status', time_estimate: 30, priority: 'Medium' },
        { title: 'Plan next week', time_estimate: 60, priority: 'High' },
        { title: 'Review goals', time_estimate: 30, priority: 'Medium' }
      ]
    }
  ];
}

function createFromTemplate(templateId, projectId, startDate) {
  const templates = getTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    return { error: 'Template not found' };
  }

  const createdTasks = [];
  const date = new Date(startDate);
  
  template.tasks.forEach((taskTemplate, index) => {
    const taskDate = new Date(date);
    taskDate.setDate(taskDate.getDate() + index);
    
    const taskData = {
      title: taskTemplate.title,
      project_id: projectId,
      status: 'ToDo',
      priority: taskTemplate.priority,
      due_date: formatDate(taskDate),
      time_estimate: taskTemplate.time_estimate,
      created_from: 'Template'
    };
    
    const result = createTask(taskData);
    createdTasks.push(result);
  });
  
  return { 
    success: true, 
    message: `Created ${createdTasks.length} tasks from template`,
    tasks: createdTasks
  };
}
