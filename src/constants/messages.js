

const NO_CHANGES_HEADER = 'No Changes';
const NO_CHANGES_BODY = 'You havent modified this ruleset. Nothing to submit!!!'
const BUTTON_PROPS_NO_CHANGES = {label: 'Generate Ruleset'};
export const NO_CHANGES_MSG = {header: NO_CHANGES_HEADER, body: NO_CHANGES_BODY, type: 'warning-panel'};

const NO_CHANGES_APPLY_HEADER = 'No Changes';
const NO_CHANGES_APPLY_BODY = 'You havent modified this ruleset. Nothing to apply!!!'
const BUTTON_PROPS_NO_CHANGES_APPLY = {label: 'Apply Ruleset'};
export const NO_CHANGES_APPLY_MSG = {header: NO_CHANGES_APPLY_HEADER, body: NO_CHANGES_APPLY_BODY, type: 'warning-panel'};

const MODIFIED_HEADER = 'Submit Ruleset';
const MODIFIED_BODY = 'You have created / modified this ruleset. Do you want to save these changes into ruleset file?'
export const MODIFIED_MSG = {header: MODIFIED_HEADER, body: MODIFIED_BODY, type: 'submit-panel', buttonProps: BUTTON_PROPS_NO_CHANGES,};

const BUTTON_PROPS_APPLY = {label: 'Apply Ruleset'};
const APPLY_HEADER = 'Apply Ruleset';
const APPLY_BODY = 'You have created / modified this ruleset. Do you want to apply these changes to remote server?'
export const APPLY_MSG = {header: APPLY_HEADER, body: APPLY_BODY, type: 'submit-panel', buttonProps: BUTTON_PROPS_APPLY,};

const NO_ATTRIBUTE_HEADER = 'No Facts';
const NO_ATTRIBUTE_BODY = 'There is no fact available in the selected ruleset.'
const BUTTON_PROPS_ATTRIBUTE = {label: 'Create Fact'};
export const NO_ATTRIBUTE_MSG = {header: NO_ATTRIBUTE_HEADER, body: NO_ATTRIBUTE_BODY, buttonProps: BUTTON_PROPS_ATTRIBUTE, type: 'warning-panel'};

const NO_KLIST_HEADER = 'No Keyword List';
const NO_KLIST_BODY = 'There is no keyword list available in the selected ruleset.'
const BUTTON_PROPS_KLIST = {label: 'Upload Keyword List'};
export const NO_KLIST_MSG = {header: NO_KLIST_HEADER, body: NO_KLIST_BODY, buttonProps: BUTTON_PROPS_KLIST, type: 'warning-panel'};


const NO_DECISION_HEADER = 'No Decisions';
const NO_DECISION_BODY = 'There is no decisions available in the selected ruleset.'
const BUTTON_PROPS_DECISION = {label: 'Create Decisions'};
export const NO_DECISION_MSG = {header: NO_DECISION_HEADER, body: NO_DECISION_BODY, buttonProps: BUTTON_PROPS_DECISION, type: 'warning-panel'};


const NO_VALIDATION_BODY = 'There is no decisions available in the selected ruleset to validate.'
export const NO_VALIDATION_MSG = {header: NO_DECISION_HEADER, body: NO_VALIDATION_BODY, type: 'warning-panel'};

export const RULE_AVAILABLE_CREATE = { type: 'warning', heading: 'This rule name exists already.' };

export const RULE_AVAILABLE_UPLOAD = { type: 'warning', heading: 'Couldnt upload the filename <name>' };

export const LIST_AVAILABLE_CREATE = { type: 'warning', heading: 'This list file name exists already' };

export const LIST_AVAILABLE_UPLOAD = { type: 'warning', heading: 'Couldnt upload the list file <name>' };

export const RULE_UPLOAD_ERROR = { type: 'error', heading: 'Problem occured when uploading the files. Try again!!'};

export const LIST_UPLOAD_ERROR = { type: 'error', heading: 'Problem occured when uploading the list file(s). Try again!!'};

export const RULE_ERROR = { type: 'error', heading: 'Sorry!, some problem occured. Please try again'};