
export const validateOutcome = (outcome) => {
    const error = {};
    console.log(`outcome in validateOutcome: ${JSON.stringify(outcome)}`);

    if (!outcome.value && !outcome.type) { //Hack: for edit rule scenario
        error.value = 'Please specify the outcome value'
    }

    return error;
}

const isEmpty = (val) => {
    if (!val) {
        return true;
    } else if (!val.trim()) {
        return true;
    }
    return false;
}

const fieldValidationByType = (value, type, operator) => {
    switch (type) {
        case 'string':
            if (operator === 'match') {
                // Validate if the attribute value is a valid regex.
                // TODO: This is a very basic regex validation. It in fact puts limitations on the regex that can be used.
                // on the RE patterns that this RULES engine can support.
                const re = /^(.*)([gimuy]*)$/;
                return re.test(value)
            } else {
                // Validate if the attribute value is a valid string with digits and alphabetic chars.
                let re = /^(\+)?[A-Za-z0-9 _-]+$/;

                let matched = re.test(value);
                console.log(`matched: ${matched}`);
                return matched
            }
        case 'number': {
            const re = RegExp('[+-]?([0-9]*[.])?[0-9]+');
            if (re.test(value)) {
                return !(isNaN(Number(value)));
            }
            return re.test(value);
        }
        case 'array': {
            if (operator === 'doesNotContain' || operator === 'contains') {
                return value.indexOf(',') === -1;
            } else {
                const arrValues = value.split(',');
                if (arrValues && arrValues.length > 0) {
                    return !arrValues.some(v => isEmpty(v))
                } else {
                    return false;
                }
            }
        }
        default:
            return true;
    }
}

export const validateAttribute = (attribute, attributes) => {
    const error = {};
    console.log(`Performing value validation`);
    console.log(`attribute: ${JSON.stringify(attribute)}`);
    if (isEmpty(attribute.operator) || attribute.operator == -1) {
        error.operator = 'Please specify the operator type'
    }

    if (isEmpty(attribute.value)) {
        error.value = 'Please specify the attribute value'
    } else {
        if (attribute.name) { // TODO: Add the validate logic for regular expression.
            const attProps = attributes.find(att => att.name === attribute.name);
            if (attProps && attProps.type) {
                if (!fieldValidationByType(attribute.value, attProps.type, attribute.operator)) {
                    error.value = 'Please specify the valid attribute value';
                } else {
                    console.log(`attribute.value: ${attribute.value}, attProps.type: ${attProps.type}, attribute.operator: ${attribute.operator} ==> validated.`);
                }

            }
        }
    }

    if (isEmpty(attribute.name)) {
        error.name = 'Please specify the attribute name'
    }

    return error;
}

export default function decisionValidations(node = {}, outcome) {
    const error = { node: {}, outcome: {} };
    error.outcome = validateOutcome(outcome);
    const validCase = node.children && node.children.length > 0;

    if (!validCase) {
        error.formError = 'Please specify atlease one condition';
    } else if (Object.keys(error.outcome).length > 0) {
        error.formError = 'Please specify valid output values';
    }
    return error;
}