import { has } from 'lodash/object';
import { isArray } from 'lodash/lang';
import { join } from 'lodash/array';

const nodeSvgShape = {
    shape: 'circle',
    shapeProps: {
        fill: '#1ABB9C',
        r: 10,
    },
};

const mapFactToChildren = (fact) => {
    if (has(fact, 'fact') && has(fact, 'operator') && has(fact, 'value') && has(fact, 'valueType')) {
        let value = fact.value;
        let valueType = fact.valueType;
        let attributes = {};
        if (isArray(fact.value)) {
            value = join(fact.value, ',');
        }

        attributes[fact.operator] = value;
        attributes['valueType'] = valueType;

        if (fact.path) {
            attributes['path'] = fact.path;
        }
        return ({ name: fact.fact, attributes });
    }
    return undefined;
};

const mapParentNode = (name) => {
    return ({ name, nodeSvgShape, children: [] });
};

//global variable to determine the depth
let depthCount;

const mapConditionsToChildren = (condition = {}, depth) => {
    const parentNode = has(condition, 'all') ? 'all' : 'any';
    const node = mapParentNode(parentNode);
    const childrenNode = condition[parentNode] && condition[parentNode].map(facts => {
        if (has(facts, 'fact')) {
            return mapFactToChildren(facts);
        } else {
            depthCount = depth > depthCount ? depth : depthCount;
            return mapConditionsToChildren(facts, depth + 1);
        }
    });
    node.children = childrenNode;
    return node;
};

export const transformRuleToTree = (conditions = []) => {
    depthCount = 0;
    console.log(`conditions in transformRuleToTree: ${JSON.stringify(conditions)}`);
    if (isArray(conditions)) {
        return conditions.map((condition) => {
            depthCount = 0;
            ruleName = conditions.ruleName;
            ruleIndex = conditions.ruleIndex;
            enabled = conditions.enabled;
            return { node: mapConditionsToChildren(condition.conditions, 1), depthCount, index: condition.index, event: condition.event};
        });
    }
    return { node: mapConditionsToChildren(conditions.conditions, 1), depthCount, index: 0, event: conditions.event, ruleName: conditions.ruleName, ruleIndex: conditions.ruleIndex, enabled: conditions.enabled };
};

const mapChildNodeToFacts = (children) => {
    console.log(`children in mapChildNodeToFacts: ${JSON.stringify(children)}`);
    const fact = { fact: children.name }; // Initialize fact object without operators

    // Assuming there's only one operator-value pair besides valueType
    Object.keys(children.attributes).forEach((key) => {
        if (key === 'valueType') {
            fact['valueType'] = children.attributes[key];
        } else {
            // Directly assign the first encountered attribute as the operator and its value
            // This assumes that there's only one such pair to process
            if (!fact.operator) { // Check if operator has not been assigned yet
                fact['operator'] = key;
                let value = children.attributes[key];
                if (String(value).indexOf(',') > -1) {
                    value = value.split(',');
                }
                fact['value'] = value;
            }
        }
    });

    console.log(`fact in mapChildNodeToFacts: ${JSON.stringify(fact)}`);
    return fact;
}

const mapNodeToCondition = (node) => {
    const parentNode = { [node.name]: [] };
    console.log(`node in mapNodeToCondition: ${JSON.stringify(node)}`);
    if (node.children && node.children.length > 0) {
        const facts = node.children.map((childNode) => {
            if (childNode.name !== 'all' && childNode.name !== 'any') {
                return mapChildNodeToFacts(childNode);
            } else {
                return mapNodeToCondition(childNode);
            }
        })
        parentNode[node.name] = facts;
    }
    return parentNode;
}


export const transformTreeToRule = (node = {}, outcome, params) => {
    return ({ conditions: mapNodeToCondition(node), event: { type: outcome.value, params } });
}