

const NO_CHANGES_HEADER = 'No Changes';
const NO_CHANGES_BODY = 'You havent modified this ruleset. Nothing to submit!!!'
const BUTTON_PROPS_NO_CHANGES = {label: 'Generate Ruleset'};
export const NO_CHANGES_MSG = {header: NO_CHANGES_HEADER, body: NO_CHANGES_BODY, type: 'warning-panel'};

const NO_CHANGES_APPLY_HEADER = 'No Changes';
const NO_CHANGES_APPLY_BODY = 'You havent modified this ruleset. Nothing to apply!!!'
const BUTTON_PROPS_NO_CHANGES_APPLY = {label: 'Apply Ruleset'};
export const NO_CHANGES_APPLY_MSG = {header: NO_CHANGES_APPLY_HEADER, body: NO_CHANGES_APPLY_BODY, type: 'warning-panel'};

const MODIFIED_HEADER = 'Save Ruleset';
const MODIFIED_BODY = 'Save ruleset to local file.'
export const MODIFIED_MSG = {header: MODIFIED_HEADER, body: MODIFIED_BODY, type: 'submit-panel', buttonProps: BUTTON_PROPS_NO_CHANGES,};

const BUTTON_PROPS_UPLOAD = {label: 'Upload Ruleset'};
const UPLOAD_HEADER = 'Upload Ruleset';
const UPLOAD_BODY = 'Upload this ruleset to rule server. Ruleset with same name will be OVERWRITTEN.'
export const UPLOAD_MSG = {header: UPLOAD_HEADER, body: UPLOAD_BODY, type: 'warning-panel', buttonProps: BUTTON_PROPS_UPLOAD,};

const BUTTON_PROPS_DEPLOY = {label: 'Deploy Ruleset'};
const DEPLOY_HEADER = 'Deploy Ruleset';
const DEPLOY_BODY = 'Upload and Activate this ruleset to production server(s).'
export const DEPLOY_MSG = {header: DEPLOY_HEADER, body: DEPLOY_BODY, type: 'warning-panel', buttonProps: BUTTON_PROPS_DEPLOY,};

const DELETE_HEADER = 'Delete Ruleset';
const DELETE_BODY = 'Delete this ruleset in local browser.'
export const DELETE_MSG = {header: DELETE_HEADER, body: DELETE_BODY, type: 'warning-panel', buttonProps: BUTTON_PROPS_NO_CHANGES,};

const BUTTON_PROPS_DELETE_SERVER = {label: 'Delete Ruleset on Server'};
const DELETE_SERVER_HEADER = 'Delete Ruleset on Server';
const DELETE_SERVER_BODY = 'Delete this ruleset on server permanently. This action cannot be undone.'
export const DELETE_SERVER_MSG = {header: DELETE_SERVER_HEADER, body: DELETE_SERVER_BODY, type: 'warning-panel', buttonProps: BUTTON_PROPS_DELETE_SERVER,};

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