import React, { Component } from 'react';
import NavLinks from './navigation-link';
import PropTypes from 'prop-types';
import { createHashHistory } from 'history';
import FooterLinks from '../footer/footer';
import footerLinks from '../../data-objects/footer-links.json';
import AppearanceContext from '../../context/apperance-context';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSquarePlus, faCloudArrowUp, faSliders } from '@fortawesome/free-solid-svg-icons';

// const navmenu = [{ name: 'Create Rules', navigate: './create-ruleset', iconClass: "icon", fontIcons: faSquarePlus, linkClass: 'navmenu'},
//                  { name: 'Upload Rules', navigate: './home', iconClass: "icon", fontIcons: faCloudArrowUp, linkClass: 'navmenu' },
//                 { name: 'Appearance', navigate: './appearance', iconClass: "icon", fontIcons: faSliders, linkClass: 'navmenu'} ];
const navmenu = [{ name: 'Create Rules', navigate: './create-ruleset', iconClass: "icon", fontIcons: faSquarePlus, linkClass: 'navmenu', title: 'Create new ruleset' },
{ name: 'Upload Rules', navigate: './upload', iconClass: "icon", fontIcons: faCloudArrowUp, linkClass: 'navmenu', title: 'Upload ruleset from local file' },
{ name: 'Get From Server', navigate: './fetch', iconClass: "icon", fontIcons: faSliders, linkClass: 'navmenu', title: 'Fetch ruleset from server' }];
class NavigationPanel extends Component {

    constructor(props) {
        super(props);
        this.state = { links: [] };
        this.handleNavLink = this.handleNavLink.bind(this);
        this.handleNavBtn = this.handleNavBtn.bind(this);
    }

    handleNavBtn() {
        const history = createHashHistory();
        history.push('./create-ruleset');
    }

    handleNavLink(name) {
        const history = createHashHistory();
        this.props.setActiveRulesetIndex(name);
        history.push('./ruleset');

    }

    render() {
        // console.log(`in NavigationPanel, this.props: ${JSON.stringify(this.props)}`);
        const { closedState, loggedIn, ruleDetails } = this.props;
        let rulesetLink = ruleDetails.length > 0 ?
            [{
                name: 'Ruleset',
                sublinks: ruleDetails.map(detail => ({ name: detail.rulename, updated: detail.updatedFlag })),
                iconClass: "rules-icon",
                linkClass: 'link-heading',
                title: ""
            }] : [];

        // console.log(`rulesetLink: ${JSON.stringify(rulesetLink)}`);

        rulesetLink = rulesetLink.concat(navmenu);

        let sideNav = loggedIn && closedState ? 'open' : 'closed';

        let appctx = this.context;

        return (
            <div className={`nav-container ${closedState ? 'closed' : 'open'} ${appctx.background}`}>
                <div className="menu-bar">
                    <a href="" onClick={(e) => { e.preventDefault(); this.props.updateState(sideNav) }}>
                        <FontAwesomeIcon className="close-icon" icon={faBars}></FontAwesomeIcon>
                    </a>
                </div>
                {!closedState && <div className="links-section">
                    <div>
                        <NavLinks links={rulesetLink} onConfirm={this.handleNavLink} activeIndex={this.props.activeIndex} />
                    </div>
                    <div className="footer-container sidenav">
                        <FooterLinks links={footerLinks} />
                    </div>
                </div>
                }
            </div>
        )
    }
}

NavigationPanel.contextType = AppearanceContext;

NavigationPanel.defaultProps = {
    closedState: false,
    ruleDetails: [],
    setActiveRulesetIndex: () => false,
    loggedIn: false,
    updateState: () => false,
    activeIndex: 0,
};

NavigationPanel.propTypes = {
    closedState: PropTypes.bool,
    ruleDetails: PropTypes.arrayOf(
        PropTypes.shape({
            rulename: PropTypes.string,
            updatedFlag: PropTypes.bool
        })
    ),
    setActiveRulesetIndex: PropTypes.func,
    loggedIn: PropTypes.bool,
    updateState: PropTypes.func,
    activeIndex: PropTypes.number,
}

export default NavigationPanel;