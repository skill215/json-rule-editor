import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Panel from '../panel/panel';
import InputField from '../forms/input-field';
import SelectField from '../forms/selectmenu-field';
import Button from '../button/button';
import attributeValidations from '../../validations/attribute-validations';
import dataTypes from '../../data-objects/operator.json';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons'
import { TitlePanel } from '../../components/panel/panel';
import Notification from '../../components/notification/notification';

const LIST_INVALID_NAME = {
    type: 'error',
    heading: 'Please enter a valid list name',
    body: 'List name can only contain alphanumeric characters, spaces, underscores and dashes'
};

const LIST_INVALID_NAME_VALID_UPLOAD = {
    type: 'warning',
    heading: 'Invalid list name specified',
    body: 'Uploaded file name will be used as list name'
};

class AddKlists extends Component {

    constructor(props) {
        super(props);
        this.state = {
            error: {}, name: props.attribute.name, type: props.attribute.type,

            //Upload file related states
            uploadedFilesCount: 0,
            files: [],
            uploadError: false,
            fileExist: false,
            listContent: {},
            message: {},
            listName: '',
            listNameSpecifiedFlag: false,
            listNameErrorFlag: false
        };

        this.handleCancel = this.handleCancel.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.onChangeName = this.onChangeName.bind(this);
        this.onChangeType = this.onChangeType.bind(this);
        this.handleUploadList = this.handleUploadList.bind(this);
        this.readFile = this.readFile.bind(this);
        this.printFile = this.printFile.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.drop = this.drop.bind(this);
        this.allowDrop = this.allowDrop.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.nameValidation = this.nameValidation.bind(this);
    }

    onChangeName(e) {
        this.setState({ name: e.target.value });
    }

    onChangeType(e) {
        this.setState({ type: e.target.value });
    }

    handleAdd(e) {
        e.preventDefault();
        const error = attributeValidations({ name: this.state.name, type: this.state.type });

        if (Object.keys(error).length > 0) {
            this.setState({ error });
        } else {
            this.props.addAttribute({ name: this.state.name, type: this.state.type });
        }
    }

    handleCancel() {
        this.props.cancel();
    }

    readFile(file, cb) {
        // eslint-disable-next-line no-undef
        var reader = new FileReader();
        reader.onload = () => {
            try {
                // console.log(`File read successfully: ${file.name}`);
                // Add a new entry to listContent with the file name as the key and the file content as the value
                this.setState(prevState => {
                    const updatedListContent = {
                        ...prevState.listContent,
                        [file.name]: reader.result
                    };
                    // console.log(`Updated listContent: ${JSON.stringify(updatedListContent)}`);
                    return { listContent: updatedListContent };
                });
                cb(file.name);
            } catch (e) {
                // console.log(`Error reading file: ${e.message}`);
                cb(undefined, e.message);
            }
        }
        // console.log(`Starting to read file: ${file.name}`);
        return reader.readAsText(file);
    }

    printFile(name, error) {
        // console.log(`Processing file: ${name}`);
        if (error) {
            // console.log(`Error: ${error}`);
            this.setState({ uploadError: true, fileExist: false, message: LIST_UPLOAD_ERROR });
        } else {
            // const isFileAdded = this.state.files.includes(name);
            // console.log(`Is file already added: ${isFileAdded}`);
            // if (!isFileAdded) {
            this.setState({ files: [name], fileExist: false });
            // } 
            // else {
            //     const message = { ...LIST_AVAILABLE_UPLOAD, heading: LIST_AVAILABLE_UPLOAD.heading.replace('<name>', name) };
            //     this.setState({ fileExist: true, message });
            // }
        }
    }

    uploadFile(file) {
        // console.log(`Uploading file: ${file.name}`);
        this.readFile(file, this.printFile);
    }

    allowDrop(e) {
        e.preventDefault();
    }

    drop(e) {
        // console.log('Drop event triggered');
        // console.log(`this.state: ${JSON.stringify(this.state)}`);
        e.preventDefault();
        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
            let item = items[0];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                console.log(`Dropped item is a file: ${file.name}`);

                let shouldUploadFile = true;

                const fileExtension = file.name.split('.').pop(); // get file extension
                console.log(`File extension: ${fileExtension}`);

                if (fileExtension !== 'txt') {
                    console.warn(`Error: The file with extension ${fileExtension} is not a text file`);
                    this.setState({ uploadMessage: `Error: Please upload a text file (with extension '.txt')` });
                    this.setState({ uploadError: true });
                    shouldUploadFile = false;
                }

                if (this.state.name) {
                    const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, ""); // remove file extension from name
                    if (nameWithoutExtension !== this.state.name) {
                        console.warn(`Error: The name in the file (${nameWithoutExtension}) is not the same as the provided name parameter (${this.state.name})`);
                        this.setState({ uploadMessage: `Error: The name in the file (${nameWithoutExtension}) is not the same as the provided name parameter (${this.state.name})` });
                        this.setState({ uploadError: true });
                        shouldUploadFile = false;
                    }
                }

                if (shouldUploadFile) {
                    this.setState({ uploadError: false, uploadMessage: '', message: {} });
                    this.uploadFile(file);
                }
            }
        }
    }

    nameValidation = (value) => {

        // Validate if the attribute value is a valid string with digits and alphabetic chars.
        let re = /^(\+)?[A-Za-z0-9 _-]+$/;

        let matched = re.test(value);
        console.log(`matched: ${matched}`);
        return matched

    }
    handleNameChange = (e) => {
        if (e.target.value !== '' && this.nameValidation(e.target.value) == true) {
            this.setState({ listName: e.target.value, listNameSpecifiedFlag: true, listNameErrorFlag: false, message: {} });
            console.log(`List name specified: ${e.target.value}`);
        } else {
            this.setState({ listNameErrorFlag: true, listName: '' });
        }
    }

    handleUploadList() {
        const { listNameSpecifiedFlag, listName } = this.state;
        // console.log('Handling upload list');
        if (Object.keys(this.state.listContent).length > 0) {
            const listContentArray = Object.entries(this.state.listContent).map(([name, value]) => {
                // console.log(`Processing list content item: ${name}`);
                if (listNameSpecifiedFlag) {
                    console.log(`Use specified name: ${listName}`);
                    this.setState({ listNameSpecifiedFlag: false, listName: '' });
                    return {
                        name: listName,
                        type: "string",
                        value: value.split(/[,;]/).map(item => item.trim()) // split on either comma or semicolon
                    };
                } else {
                    const nameWithoutExtension = name.replace(/\.[^/.]+$/, ""); // remove file extension from name
                    return {
                        name: nameWithoutExtension,
                        type: "string",
                        value: value.split(/[,;]/).map(item => item.trim()) // split on either comma or semicolon
                    };
                }
            });

            // console.log(`Uploading list content array: ${JSON.stringify(listContentArray)}`);
            this.props.uploadList(listContentArray);
            this.props.clearRuleIndex();
        }
    }

    render() {
        const { buttonProps } = this.props;
        const { uploadError, uploadMessage, message, listNameErrorFlag } = this.state;
        const attribute_types = Object.keys(dataTypes);
        const title = "Upload List";
        const appctx = this.context;

        // console.log(`uploadError: ${uploadError}, uploadMessage: ${uploadMessage}`);

        return (<Panel>
            {uploadError && !listNameErrorFlag && <Notification body={''} heading={uploadMessage} type={'error'} />}
            {!uploadError && listNameErrorFlag && <Notification body={LIST_INVALID_NAME_VALID_UPLOAD.body} heading={LIST_INVALID_NAME_VALID_UPLOAD.heading} type={LIST_INVALID_NAME_VALID_UPLOAD.type} />}
            {uploadError && listNameErrorFlag && <Notification body={LIST_INVALID_NAME.body} heading={LIST_INVALID_NAME.heading} type={LIST_INVALID_NAME.type} />}

            <form>
                <div className='form-groups-inline'>
                    {this.props.attribute.name && <div>{this.props.attribute.name}</div>}
                    <TitlePanel title={title} titleClass={faCloudArrowUp}>

                        <div className="upload-panel">
                            <div
                                className={`drop-section ${appctx.background}`}
                                onDrop={this.drop}
                                onDragOver={this.allowDrop}
                                style={{
                                    width: '100%', // or any specific value
                                    height: '50px', // or any specific value
                                    border: '2px dashed #999',
                                    backgroundColor: '#f3f3f3',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: '#999',
                                }}
                            >
                                <div>Drop Files Here</div>
                                {this.state.files.length > 0 && <div className="file-drop-msg">{`${this.state.files.length} files are dropped!`}</div>}
                            </div>
                        </div>
                        <div className="add-field-panel">
                            <div title="Rename the list optionally. Or the list name will be the filename."> (Opt.)Specify List Name:</div>
                            <div>
                                <input type="text" placeholder="Enter list name" onChange={this.handleNameChange} />
                            </div>
                        </div>
                        <div className="btn-group">
                            <Button label={"Upload"} onConfirm={this.handleUploadList} classname="primary-btn" type="button" />
                            <Button label={"Cancel"} onConfirm={this.handleCancel} classname="primary-btn" type="button" />
                        </div>
                    </TitlePanel>
                </div>

            </form>
        </Panel>);
    }
}


AddKlists.defaultProps = ({
    addAttribute: () => false,
    cancel: () => false,
    clearRuleIndex: () => false,
    attribute: {},
    buttonProps: {},
});

AddKlists.propTypes = ({
    addAttribute: PropTypes.func,
    cancel: PropTypes.func,
    uploadList: PropTypes.func,
    clearRuleIndex: PropTypes.func,
    attribute: PropTypes.object,
    buttonProps: PropTypes.object,
});


export default AddKlists;

