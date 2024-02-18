import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Panel from '../panel/panel';
import InputField from '../forms/input-field';
import SelectField from '../forms/selectmenu-field';
import Button from '../button/button';
import Table from '../table/table';
import Banner from '../panel/banner';
import * as Message from '../../constants/messages';
import { validateRuleset } from '../../validations/rule-validation';
import Loader from '../loader/loader';
import { ViewOutcomes } from '../attributes/view-attributes';

class ValidateRules extends Component {

    constructor(props) {
        super(props);
        // const conditions = props.attributes.filter(attr => attr.type !== 'object' && ({ name: attr.name, value: '' }))
        const {vState} = this.props;
        console.log(`vState in ValidateRules: ${JSON.stringify(vState)}`)
        this.state = {
            attributes: [],
            conditions: vState.conditions,
            message: Message.NO_VALIDATION_MSG,
            errorMessage: vState.errorMessage ? vState.errorMessage : '',
            loading: false,
            outcomes: vState.outcomes ? vState.outcomes : [],
            error: vState.error ? vState.error : false,
            result: vState.result ? vState.result : false,
        };
        // this.handleAttribute = this.handleAttribute.bind(this);
        this.handleValue = this.handleValue.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.validateRules = this.validateRules.bind(this);
        this.handleReset = this.handleReset.bind(this);
    }

    // handleAttribute(e, index) {
    //     const attribute = { ...this.state.conditions[index], name: e.target.value };
    //     const conditions = [ ...this.state.conditions.slice(0, index), attribute, ...this.state.conditions.slice(index + 1)];
    //     this.setState({ conditions });
    // }

    handleValue(e, index) {

        let tmpvalue = e.target.value;

        // Replace all "," with ";"
        if (tmpvalue.includes(',')) {
            tmpvalue = tmpvalue.replace(/,/g, ';');
            console.warn("',' is not allowed, replaced with ';'");
        }

        const attribute = { ...this.state.conditions[index], value: tmpvalue };
        const conditions = [...this.state.conditions.slice(0, index), attribute, ...this.state.conditions.slice(index + 1)];
        this.setState({ conditions });

        // Update the vState in the parent
        const { outcomes, result, error, errorMessage } = this.state;
        const vState = { conditions, outcomes, result, error, errorMessage};
        this.props.updateVState(vState);
    }

    handleAdd() {
        const conditions = this.state.conditions.concat([{ name: '' }]);
        this.setState({ conditions: conditions });

        // Update the vState in the parent
        const { outcomes, result, error, errorMessage } = this.state;
        const vState = { conditions, outcomes, result, error, errorMessage };
        this.props.updateVState(vState);
    }

    handleReset() {

    }

    validateRules(e) {
        e.preventDefault();
        let facts = {};
        const { decisions, attributes } = this.props;
        this.setState({ loading: true });
        this.state.conditions.forEach(condition => {
            const attrProps = attributes.find(attr => attr.name === condition.name);
            console.log(`attrProps == ${JSON.stringify(attrProps)}`);
            if (attrProps.type === 'number') {
                facts[condition.name] = Number(condition.value);
            } else if (condition.value && condition.value.indexOf(',') > -1) {
                facts[condition.name] = condition.value.split(',');
            } else {
                facts[condition.name] = condition.value;
            }
        })
        console.log(`facts == ${JSON.stringify(facts)}`);
        this.props.sendValidate(facts, this.props.ruleset)
            .then(sendResult => {
                console.log(`sendResult == ${JSON.stringify(sendResult)}`);
                let outcomesBuffer = [];
                if (sendResult && sendResult.data.success == true) {
                    outcomesBuffer = sendResult.data.success ? sendResult.data.data.message : '';
                    this.setState({
                        loading: false,
                        outcomes: outcomesBuffer,
                        result: true,
                        error: false,
                        errorMessage: '',
                    });
                } else {
                    outcomesBuffer = sendResult.data ? sendResult.data.message : '';
                    this.setState({
                        loading: false,
                        outcomes: outcomesBuffer,
                        error: true,
                        errorMessage: sendResult.data ? sendResult.data.message : 'An error occurred in communicating the rule engine',
                        result: true,
                    });
                }

                // Update the vState in the parent
                const { conditions, result, error, errorMessage } = this.state;
                const vState = { conditions, outcomes: outcomesBuffer, result, error, errorMessage};
                this.props.updateVState(vState);
            })
            .catch(error => {
                console.error(`Error in sendValidate: ${error}`);
                this.setState({
                    loading: false,
                    error: true,
                    errorMessage: 'An error occurred during validation',
                    result: true,
                });
            });


        // validateRuleset(facts, decisions).then(outcomes => {
        //     this.setState({loading: false, outcomes,  result: true, error: false, errorMessage: '',});
        // }).catch((e) => {
        //     this.setState({loading: false, error: true, errorMessage: e.error, result: true, });
        // });
    }

    attributeItems = () => {
        const { conditions, outcomes, loading, result, error, errorMessage } = this.state;
        // const { conditions, outcomes } = this.props.vState;
        const { attributes } = this.props;
        const options = attributes.map(att => att.name);
        console.log(` conditions == ${JSON.stringify(conditions)}`)
        console.log(` outcomes == ${JSON.stringify(outcomes)}`)

        const formElements = conditions.map((condition, index) =>
        (<tr key={condition.name + index || 'item' + index}>
            <td><div>{condition.name}</div></td>
            <td colSpan='2'>{<InputField onChange={e => this.handleValue(e, index)} value={condition.value} />}</td>
        </tr>)
        );

        let message;
        if (result) {
            console.log(`result = ${JSON.stringify(result)}`);
            // console.log(`outcomes == ${JSON.stringify(outcomes)}`);
            console.log(`outcomes == ${outcomes}`);

            if (error) {
                message = <div className="form-error">{errorMessage}</div>
            } else if (outcomes && outcomes.length < 1) {
                message = <div>No results found</div>
            } else if (outcomes && outcomes.length > 0) {
                let displayed = JSON.stringify(outcomes);
                message = (<div className="view-params-container">
                    <h4>Validate Result: </h4>
                    <p>{outcomes}</p>
                </div>)
            } else {
                message = undefined;
            }
        }
        return (
            <React.Fragment>
                <Table columns={['Name', 'Value']}>
                    {formElements}
                </Table>
                <div className="btn-group">
                    <Button label={'Validate'} onConfirm={this.validateRules} classname="primary-btn" type="submit" />
                    <Button label={'Reset'} onConfirm={this.handelReset} classname="primary-btn" type="reset" />
                </div>
                <hr />
                {loading && <Loader />}
                {!loading && message}
            </React.Fragment>)
    }

    render() {

        return (<React.Fragment>
            {this.props.decisions.length < 1 && <Banner message={this.state.message} />}
            {this.props.decisions.length > 0 &&
                <Panel>
                    <form>
                        <div>
                            {this.attributeItems()}
                        </div>
                    </form>
                </Panel>}
        </React.Fragment>);
    }
}

ValidateRules.defaultProps = ({
    attributes: [],
    decisions: [],
    ruleset: {},
    // vState: {},
});

ValidateRules.propTypes = ({
    attributes: PropTypes.array,
    decisions: PropTypes.array,
    vState: PropTypes.object,
    ruleset: PropTypes.object,
    sendValidate: PropTypes.func,
    updateVState: PropTypes.func,
});

export default ValidateRules;