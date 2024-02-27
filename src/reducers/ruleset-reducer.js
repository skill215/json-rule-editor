import * as ActionTypes from '../actions/action-types';
import { cloneDeep } from 'lodash/lang';
import { findIndex } from 'lodash/array';
import attributesPredefined from '../data-objects/facts.json';
import { name } from 'file-loader';

const initialState = {
    rulesets: [],
    activeRuleset: 0,
    updatedFlag: [],
    uploadedRules: [],
}

const replaceRulesetByIndex = (rulesets, targetset, index) => {
    return [...rulesets.slice(0, index), targetset, ...rulesets.slice(index + 1)];
}

const moveRuleUpByIndex = (activeRuleSet, ruleIndex) => {
    activeRuleSet.decisions.sort((a, b) => a.ruleIndex - b.ruleIndex);

    const decisions = activeRuleSet.decisions;
    const indexToMove = decisions.findIndex(decision => decision.ruleIndex === ruleIndex);

    if (indexToMove <= 0) {
        // console.log(`in moveRuleUpByIndex, the ruleset is not changed because indexToMove: ${indexToMove} is out of bounds`);
        return activeRuleSet;
    }

    // console.log(`in moveRuleUpByIndex, decisions before change: ${JSON.stringify(decisions)} `);

    // Swap ruleIndex of the current decision and the next decision
    const temp = decisions[indexToMove].ruleIndex;
    decisions[indexToMove].ruleIndex = decisions[indexToMove - 1].ruleIndex;
    decisions[indexToMove - 1].ruleIndex = temp;

    activeRuleSet.decisions.sort((a, b) => a.ruleIndex - b.ruleIndex);

    // console.log(`in moveRuleUpByIndex, decisions: ${JSON.stringify(decisions)} `);

    return activeRuleSet;
}

const moveRuleDownByIndex = (activeRuleSet, ruleIndex) => {
    activeRuleSet.decisions.sort((a, b) => a.ruleIndex - b.ruleIndex);

    const decisions = activeRuleSet.decisions;
    const indexToMove = decisions.findIndex(decision => decision.ruleIndex === ruleIndex);

    if (indexToMove >= decisions.length - 1) {
        // console.log(`in moveRuleDownByIndex, the ruleset is not changed because indexToMove: ${indexToMove} is out of bounds`);
        return activeRuleSet;
    }

    // console.log(`in moveRuleDownByIndex, decisions before change: ${JSON.stringify(decisions)} `);

    // Swap ruleIndex of the current decision and the next decision
    const temp = decisions[indexToMove].ruleIndex;
    decisions[indexToMove].ruleIndex = decisions[indexToMove + 1].ruleIndex;
    decisions[indexToMove + 1].ruleIndex = temp;

    activeRuleSet.decisions.sort((a, b) => a.ruleIndex - b.ruleIndex);

    // console.log(`in moveRuleDownByIndex, decisions: ${JSON.stringify(decisions)} `);

    return activeRuleSet;
}

const refreshIndex = (rulesets, activeRulesetIndex) => {
    // Sort decisions based on ruleIndex
    rulesets[activeRulesetIndex].decisions.sort((a, b) => a.ruleIndex - b.ruleIndex);
    // Update ruleIndex of remaining decisions
    rulesets[activeRulesetIndex].decisions.forEach((decision, index) => {
        decision.ruleIndex = index;
    });
}



const removeDecisionByIndex = (rulesets, activeRulesetIndex, decisionIndex) => {
    // console.log(`in removeDecisionByIndex, decisionIndex: ${decisionIndex} `);
    // console.log(`in removeDecisionByIndex, rulesets[${activeRulesetIndex}].decisions.decision.ruleIndex:  ${rulesets[activeRulesetIndex].decisions[0].ruleIndex}`);

    // Filter out the decision with the specified ruleIndex
    rulesets[activeRulesetIndex].decisions = rulesets[activeRulesetIndex].decisions.filter(decision => Number(decision.ruleIndex) != decisionIndex);

    // Call refreshIndex to update ruleIndex of remaining decisions
    refreshIndex(rulesets, activeRulesetIndex);
    // console.log(`in removeDecisionByIndex, rulesets: ${JSON.stringify(rulesets)} `);
    return rulesets;
}

const removeDecisionsByOutcome = (rulesets, activeRulesetIndex, outcome) => {
    const newRulesets = [...rulesets]; // Create a copy of the array
    const activeRuleSet = { ...newRulesets[activeRulesetIndex] }; // Get the active rule set
    activeRuleSet.decisions = activeRuleSet.decisions.filter(decision => decision.event && decision.event.type !== outcome); // Remove decisions with the specified outcome
    newRulesets[activeRulesetIndex] = activeRuleSet; // Replace the active rule set in the new array
    return newRulesets;
}

function ruleset(state = initialState, action = '') {

    // console.log(`Ruleset in reducer: ${JSON.stringify(state.rulesets)}`)

    switch (action.type) {

        case ActionTypes.UPLOAD_RULESET: {

            const { ruleset } = action.payload;
            // console.log(`in ActionTypes.UPLOAD_RULESET, ruleset: ${JSON.stringify(ruleset)} `);
            // Check if there is already a ruleset with the same name
            const existingRuleset = state.rulesets.find(r => r.name === ruleset.name);

            if (existingRuleset) {
                // If there is already a ruleset with the same name, replace it with the new ruleset
                // console.log(`in ActionTypes.UPLOAD_RULESET, there is duplicated ruleset: ${existingRuleset.name} `);
                return {...state};
            } else {
                const rulesets = state.rulesets.concat(ruleset);
                return { ...state, rulesets: cloneDeep(rulesets), uploadedRules: cloneDeep(rulesets) }
            }
        }

        case ActionTypes.ADD_RULESET: {

            const { name } = action.payload;
            const ruleset = { name, attributes: attributesPredefined.attributes, decisions: [] };
            // console.log(`in ActionTypes.ADD_RULESET, ruleset: ${JSON.stringify(ruleset)} `);
            const count = state.rulesets.length === 0 ? 0 : state.rulesets.length;
            return { ...state, rulesets: state.rulesets.concat(ruleset), activeRuleset: count }
        }

        case ActionTypes.UPDATE_RULESET_INDEX: {

            const { name } = action.payload;
            const index = findIndex(state.rulesets, { name });
            return { ...state, activeRuleset: index }
        }

        case ActionTypes.ADD_DECISION: {
            const { condition, metadata } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            const decision = { ...metadata, ...condition[0] };
            activeRuleSet.decisions = activeRuleSet.decisions.concat(decision);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: replaceRulesetByIndex(state.rulesets, activeRuleSet, state.activeRuleset)
            }
        }

        case ActionTypes.UPDATE_DECISION: {
            const { condition, metadata, ruleIndex } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };

            activeRuleSet.decisions = activeRuleSet.decisions.map(d => {
                if (d.ruleIndex == ruleIndex) {
                    return {
                        ...d,
                        ruleName: metadata.ruleName,
                        description: metadata.description,
                        enabled: metadata.enabled,
                        conditions: condition[0].conditions,
                        event: condition[0].event
                    };
                }
                return d;
            });

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: replaceRulesetByIndex(state.rulesets, activeRuleSet, state.activeRuleset)
            }
        }

        case ActionTypes.UPDATE_RULE: {
            const rule = action.payload.rule;
            const { ruleIndex } = rule;
            // console.log(`in ActionTypes.UPDATE_RULE, rule: ${JSON.stringify(rule)}, ruleIndex: ${ruleIndex} `);
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            // console.log(`in ActionTypes.UPDATE_RULE, activeRuleSet.decisions: ${JSON.stringify(activeRuleSet.decisions)} `);
            activeRuleSet.decisions = activeRuleSet.decisions.map(d => d.ruleIndex == ruleIndex ? rule : d);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            // console.log(`in ActionTypes.UPDATE_RULE, new activeRuleSet.decisions: ${JSON.stringify(activeRuleSet.decisions)} `);
            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: replaceRulesetByIndex(state.rulesets, activeRuleSet, state.activeRuleset)
            }
        }


        case ActionTypes.REMOVE_DECISION: {
            const { decisionIndex } = action.payload;
            const newRulesets = removeDecisionByIndex(state.rulesets, state.activeRuleset, decisionIndex);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: newRulesets
            }
        }

        case ActionTypes.REMOVE_DECISIONS: {
            const { outcome } = action.payload;
            const newRulesets = removeDecisionsByOutcome(state.rulesets, state.activeRuleset, outcome);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: newRulesets
            }
        }

        case ActionTypes.ADD_ATTRIBUTE: {
            const { attribute } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            activeRuleSet.attributes.push(attribute);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: replaceRulesetByIndex(state.rulesets, activeRuleSet, state.activeRuleset)
            }
        }

        case ActionTypes.UPDATE_ATTRIBUTE: {
            const { attribute, index } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            activeRuleSet.attributes.splice(index, 1, attribute);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: replaceRulesetByIndex(state.rulesets, activeRuleSet, state.activeRuleset)
            }
        }

        case ActionTypes.REMOVE_ATTRIBUTE: {
            const { index } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            activeRuleSet.attributes.splice(index, 1);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: replaceRulesetByIndex(state.rulesets, activeRuleSet, state.activeRuleset)
            }
        }

        case ActionTypes.RESET_ATTRIBUTE: {
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            if (state.uploadedRules[state.activeRuleset] && state.uploadedRules[state.activeRuleset].attributes) {
                activeRuleSet.attributes = cloneDeep(state.uploadedRules[state.activeRuleset].attributes);

                return {
                    ...state,
                    rulesets: replaceRulesetByIndex(state.rulesets, activeRuleSet, state.activeRuleset)
                }
            }
            return { ...state };
        }

        case ActionTypes.RESET_DECISION: {
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            if (state.uploadedRules[state.activeRuleset] && state.uploadedRules[state.activeRuleset].decisions) {
                activeRuleSet.decisions = cloneDeep(state.uploadedRules[state.activeRuleset].decisions);

                return {
                    ...state,
                    rulesets: replaceRulesetByIndex(state.rulesets, activeRuleSet, state.activeRuleset)
                }
            }
            return { ...state };
        }

        case ActionTypes.MOVE_RULE_UP: {
            const { ruleIndex } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            // console.log(`in MOVE_RULE_UP, action.payload: ${JSON.stringify(action.payload)} `);
            const rulesets = moveRuleUpByIndex(activeRuleSet, ruleIndex);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: replaceRulesetByIndex(state.rulesets, rulesets, state.activeRuleset)
            }
        }

        case ActionTypes.MOVE_RULE_DOWN: {
            const { ruleIndex } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            // console.log(`in MOVE_RULE_DOWN, action.payload: ${JSON.stringify(action.payload)} `);
            const rulesets = moveRuleDownByIndex(activeRuleSet, ruleIndex);

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return {
                ...state,
                updatedFlag, // Use the updated array
                rulesets: replaceRulesetByIndex(state.rulesets, rulesets, state.activeRuleset)
            }
        }
        case ActionTypes.UPLOAD_LIST: {
            const kList = action.payload;
            // console.log(`Action payload: kList = ${JSON.stringify(kList)}`);

            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            // console.log(`Active rule set before update: ${JSON.stringify(activeRuleSet)}`);

            // Ensure activeRuleSet is defined
            if (activeRuleSet) {
                // If activeRuleSet.keywords is undefined, initialize it as an empty array
                if (!Array.isArray(activeRuleSet.keywords)) {
                    activeRuleSet.keywords = [];
                }

                // For each keyword in kList.klist
                kList.klist.forEach(newKeyword => {
                    // Find the index of the keyword with the same name in the existing keyword list
                    const index = activeRuleSet.keywords.findIndex(keyword => keyword.name === newKeyword.name);

                    if (index !== -1) {
                        // If a keyword with the same name exists, replace it with the new keyword
                        activeRuleSet.keywords[index] = newKeyword;
                    } else {
                        // If no such keyword exists, append the new keyword to the keyword list
                        activeRuleSet.keywords.push(newKeyword);
                    }
                });
            } else {
                // console.error('activeRuleSet is undefined');
            }

            // console.log(`Updated keywords: ${JSON.stringify(activeRuleSet.keywords)}`);

            // console.log(`Active rule set after update: ${JSON.stringify(activeRuleSet)}`);

            // Update the ruleset in the rulesets array
            const rulesets = [...state.rulesets];
            rulesets[state.activeRuleset] = activeRuleSet;

            return { ...state, rulesets: rulesets, uploadedRules: cloneDeep(rulesets) }
        }

        case ActionTypes.REMOVE_LIST: {
            const { name } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            // console.log(`Active rule set before update: ${JSON.stringify(activeRuleSet)}`);

            // Filter out the keyword object with the same name as action.payload.name
            activeRuleSet.keywords = activeRuleSet.keywords.filter(keyword => keyword.name !== name);

            // console.log(`Active rule set after update: ${JSON.stringify(activeRuleSet)}`);

            // Update the ruleset in the rulesets array
            const rulesets = [...state.rulesets];
            rulesets[state.activeRuleset] = activeRuleSet;

            return { ...state, rulesets: rulesets, uploadedRules: cloneDeep(rulesets) }
        }

        case ActionTypes.UPDATE_DEFAULT_ACTION: {
            const { defaultAction } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            // console.log(`Active rule set before update: ${JSON.stringify(activeRuleSet)}`);

            // Update the defaultAction
            activeRuleSet.defaultAction = defaultAction;

            // console.log(`Active rule set after update: ${JSON.stringify(activeRuleSet)}`);

            // Update the ruleset in the rulesets array
            const rulesets = [...state.rulesets];
            rulesets[state.activeRuleset] = activeRuleSet;

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return { ...state, rulesets: rulesets, uploadedRules: cloneDeep(rulesets), updatedFlag }
        }

        case ActionTypes.UPDATE_FEATURE: {
            const { feature } = action.payload;
            const activeRuleSet = { ...state.rulesets[state.activeRuleset] };
            // console.log(`Active rule set before update: ${JSON.stringify(activeRuleSet)}`);

            // Update the feature
            activeRuleSet.feature = feature;
            // console.log(`Updated feature: ${JSON.stringify(activeRuleSet.feature)}`)

            // console.log(`Active rule set after update: ${JSON.stringify(activeRuleSet)}`);

            // Update the ruleset in the rulesets array
            const rulesets = [...state.rulesets];
            rulesets[state.activeRuleset] = activeRuleSet;

            // Create a copy of the updatedFlag array
            const updatedFlag = [...state.updatedFlag];
            // Set the value at state.activeRuleset to true
            updatedFlag[state.activeRuleset] = true;

            return { ...state, rulesets: rulesets, uploadedRules: cloneDeep(rulesets), updatedFlag }
        }

        case ActionTypes.CLEAR_UPDATED_FLAG: {
            const updatedFlag = [...state.updatedFlag];
            // console.log(`in CLEAR_UPDATED_FLAG, updatedFlag: ${JSON.stringify(updatedFlag)} `);
            updatedFlag[state.activeRuleset] = false;
            // console.log(`in CLEAR_UPDATED_FLAG, updatedFlag: ${JSON.stringify(updatedFlag)} `);
            return { ...state, updatedFlag }
        }

        default:
            return { ...state };
    }
}

export default ruleset;