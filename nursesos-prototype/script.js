/* ============================================================
   NurseSOS Prototype — script.js
   Simulates a live two-sided chat using plain DOM manipulation.
   Files are staged as attachments first and only delivered on Form Submit!
   ============================================================ */

// ===== STEP 1: Grab references to all elements =====
const patientForm      = document.getElementById('patientForm');
const nurseForm        = document.getElementById('nurseForm');
const patientInput     = document.getElementById('patientInput');
const nurseInput       = document.getElementById('nurseInput');
const patientMsgs      = document.getElementById('patientMessages');
const nurseMsgs        = document.getElementById('nurseMessages');

// Media upload interactive nodes
const patientFile      = document.getElementById('patientFile');
const nurseFile        = document.getElementById('nurseFile');
const patientAttachBtn = document.getElementById('patientAttachBtn');
const nurseAttachBtn   = document.getElementById('nurseAttachBtn');

// ===== NEW STEP: Staging areas to hold files before sending =====
let stagedPatientFile = null;
let stagedNurseFile = null;

// ===== STEP 2: Helper — get current time string =====
function getTimeString() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ===== STEP 3: Helper — create text or media message wrappers =====
function createMessageElement(text, type, mediaUrl = null, mediaType = null) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message message--' + type;

  const bubble = document.createElement('div');
  bubble.className = 'message__bubble';

  // Process and embed file attachments if present
  if (mediaUrl) {
    if (mediaType.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = mediaUrl;
      img.className = 'message__media-content';
      img.alt = 'Uploaded clinical image presentation';
      bubble.appendChild(img);
    } else if (mediaType.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.className = 'message__media-content';
      video.controls = true;
      bubble.appendChild(video);
    }
  }

  // Append companion text captions
  if (text || !mediaUrl) {
    const textNode = document.createTextNode(text);
    if (mediaUrl && text) bubble.appendChild(document.createElement('br'));
    if (text) bubble.appendChild(textNode);
  }

  const time = document.createElement('div');
  time.className = 'message__time';
  time.textContent = getTimeString();

  msgDiv.appendChild(bubble);
  msgDiv.appendChild(time);

  return msgDiv;
}

// ===== STEP 4: Mirror text or media packets into BOTH display containers =====
function addMessage(text, sender, mediaUrl = null, mediaType = null) {
  let patientType, nurseType;

  if (sender === 'patient') {
    patientType = 'patient';    
    nurseType   = 'nurse';      
  } else {
    patientType = 'nurse';      
    nurseType   = 'patient';   
  }

  const patientMsgEl = createMessageElement(text, patientType, mediaUrl, mediaType);
  const nurseMsgEl   = createMessageElement(text, nurseType, mediaUrl, mediaType);

  patientMsgs.appendChild(patientMsgEl);
  nurseMsgs.appendChild(nurseMsgEl);

  // Keep chat containers scrolled down automatically
  patientMsgs.scrollTop = patientMsgs.scrollHeight;
  nurseMsgs.scrollTop   = nurseMsgs.scrollHeight;
}

// ===== NEW STEP 5: Helper to render localized attachment previews inside chat input area =====
function updateInputPreview(sender) {
  const form = sender === 'patient' ? patientForm : nurseForm;
  const fileObj = sender === 'patient' ? stagedPatientFile : stagedNurseFile;
  
  // Remove old preview container if it exists
  const existingPreview = form.querySelector('.chat-panel__preview-container');
  if (existingPreview) existingPreview.remove();

  if (!fileObj) return;

  // Create UI preview layout element
  const previewDiv = document.createElement('div');
  previewDiv.className = 'chat-panel__preview-container';

  let previewItem;
  if (fileObj.type.startsWith('image/')) {
    previewItem = document.createElement('img');
  } else {
    previewItem = document.createElement('div');
    previewItem.textContent = "🎬 Video File";
    previewItem.style.fontSize = "0.75rem";
  }
  
  previewItem.src = fileObj.url;
  previewItem.className = 'chat-panel__preview-thumb';

  // Add a cancel/remove button to clear staging slot
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'chat-panel__preview-remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.onclick = () => {
    if (sender === 'patient') stagedPatientFile = null;
    else stagedNurseFile = null;
    updateInputPreview(sender);
  };

  previewDiv.appendChild(previewItem);
  previewDiv.appendChild(removeBtn);
  
  // Insert inside the form element before the textbox
  form.insertBefore(previewDiv, form.querySelector('.chat-panel__textbox'));
}

// ===== STEP 6: Trigger Hidden Native File Pickers on Button Click =====
patientAttachBtn.addEventListener('click', () => patientFile.click());
nurseAttachBtn.addEventListener('click', () => nurseFile.click());

// ===== STEP 7: File Select Handlers (Stage data instead of instantly sending) =====
patientFile.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    stagedPatientFile = {
      url: URL.createObjectURL(this.files[0]),
      type: this.files[0].type
    };
    updateInputPreview('patient');
    this.value = ''; 
  }
});

nurseFile.addEventListener('change', function() {
  if (this.files && this.files[0]) {
    stagedNurseFile = {
      url: URL.createObjectURL(this.files[0]),
      type: this.files[0].type
    };
    updateInputPreview('nurse');
    this.value = ''; 
  }
});

// ===== STEP 8: Handle Form Submissions (Package staged media + text together) =====
patientForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const text = patientInput.value.trim();
  
  // Guard clause: stop if both input lines and media are completely empty
  if (text === '' && !stagedPatientFile) return;

  const mediaUrl = stagedPatientFile ? stagedPatientFile.url : null;
  const mediaType = stagedPatientFile ? stagedPatientFile.type : null;

  addMessage(text, 'patient', mediaUrl, mediaType);

  // Clear states
  stagedPatientFile = null;
  updateInputPreview('patient');
  patientInput.value = '';
  patientInput.focus();
});

nurseForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const text = nurseInput.value.trim();
  
  if (text === '' && !stagedNurseFile) return;

  const mediaUrl = stagedNurseFile ? stagedNurseFile.url : null;
  const mediaType = stagedNurseFile ? stagedNurseFile.type : null;

  addMessage(text, 'nurse', mediaUrl, mediaType);

  // Clear states
  stagedNurseFile = null;
  updateInputPreview('nurse');
  nurseInput.value = '';
  nurseInput.focus();
});

// Focus on application start
patientInput.focus();