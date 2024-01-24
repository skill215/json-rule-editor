import React from 'react';
import {HashRouter, Switch, Route } from 'react-router-dom';
import HomeContainer from '../containers/home/home-container';
import RulesetContainer from '../containers/ruleset/ruleset-container';
import CreateRulesetContainer from '../containers/ruleset/create-ruleset-container';
import AppearanceContainer from '../containers/app/appearance-container';
import UploadContainer from '../containers/upload/upload-container';
import FetchContainer from '../containers/fetch/fetch-container';
import PropTypes from 'prop-types';

const AppRoutes = (props) => {
    const { background } = props.appctx;
    return (<div className={`main-container ${props.closedState ? 'closed': 'open'} ${background}`}>
        <HashRouter>
            <Switch>
                <Route path="/home" exact component={HomeContainer} />
                <Route path="/ruleset" exact component={RulesetContainer} />
                <Route path="/create-ruleset" exact component={CreateRulesetContainer} />
                <Route path="/appearance" exact component={AppearanceContainer} />
                <Route path="/upload" exact component={UploadContainer} />
                <Route path="/fetch" exact component={FetchContainer} />
            </Switch>   
        </HashRouter>
    </div>);

};

AppRoutes.defaultProps = {
    closedState: false,
    loggedIn: false,
    appctx: {},
};

AppRoutes.propTypes = {
    closedState: PropTypes.bool,
    loggedIn: PropTypes.bool,
    appctx: PropTypes.object,
}

export default AppRoutes;