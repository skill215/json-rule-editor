import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createHashHistory } from 'history';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const NavLinks = (props) => {
  const { links } = props;
  const [visible, setVisible] = useState({ 0: true });
  const history = createHashHistory();


  const enableSublinks = (e, index, navigate) => {
    e.preventDefault();
    setVisible({ [index]: !visible[index] });
    if (navigate) {
      history.push(navigate);
    }

  }

  return (links.map((link, index) => (
    <ul className="link-container" key={link.name + props.activeIndex}>
      <NavParentLink link={link} onConfirm={enableSublinks} index={index} visible={visible[index]} />
      {link.sublinks && link.sublinks.length > 0 &&
        <NavSubLink sublinks={link.sublinks} visible={visible[index]} onConfirm={props.onConfirm} activeIndex={props.activeIndex} />
      }
    </ul>)));
};

const NavParentLink = ({ link, onConfirm, index, visible }) => {
  return (
    <li className={link.linkClass} onClick={(e) => onConfirm(e, index, link.navigate)}>
      <a href="" className={`link ${visible ? 'active' : ''}`} >
        <span className={link.iconClass} />
        {link.fontIcons && <FontAwesomeIcon icon={link.fontIcons} />}
        <span className="text" title={link.title}>{link.name}</span>
      </a>
    </li>);
};

NavParentLink.defaultProps = {
  link: {},
  onConfirm: () => undefined,
  index: 0,
  visible: false,
};

NavParentLink.propTypes = {
  link: PropTypes.object,
  onConfirm: PropTypes.func,
  index: PropTypes.number,
  visible: PropTypes.bool,
};


const NavSubLink = ({ sublinks, visible, onConfirm, activeIndex }) => {

  const [active, setActive] = useState(sublinks[activeIndex]);
  console.log(`activeIndex: ${JSON.stringify(activeIndex)} active: ${JSON.stringify(active)}`)

  const handleClick = (e, link) => {
    e.preventDefault();
    setActive(link);
    onConfirm(link);
  }

  return (sublinks.map((link, index) =>
  (<ul className={`sublink-container ${visible ? 'visible' : ''}`} key={link.name}>
    <li className={`sublink ${visible ? 'visible' : ''} ${active.name === link.name ? 'active' : ''}`} onClick={(e) => handleClick(e, link.name)}>
      <a href="" className="link">
        <span className="text">{link.name}{link.updated ? ' *' : ''}</span>
      </a>
    </li>
  </ul>)));
}

export default NavLinks;