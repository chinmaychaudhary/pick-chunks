import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import { ListItemIcon } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import Link from '@material-ui/core/Link';
import CollectionsIcon from '@material-ui/icons/Collections';
import { useState } from 'react';
import { useRouter } from 'next/router';
const useStyles = makeStyles((theme) => ({
  drawer: {
    color: 'red',
    width: '200px',
    height: '100vh',
  },
  page: {
    width: '80vw',
  },
}));

const Layout = ({ children }) => {
  const classes = useStyles();
  const router = useRouter();
  const [selectedlink, setSelectedLink] = useState(router.pathname);
  const handleLinkSelect = (e) => {
    console.log('handleLink', e);
  };
  return (
    <Box display="flex" flexDirection="row">
      <div className={classes.drawer}>
        <List>
          <ListItem button component={Link} href="/" selected={selectedlink === '/'} onClick={handleLinkSelect}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Add" />
          </ListItem>
          <ListItem
            button
            component={Link}
            href="/dashboard"
            selected={selectedlink === '/dashboard'}
            onClick={handleLinkSelect}
          >
            <ListItemIcon>
              <CollectionsIcon />
            </ListItemIcon>
            <ListItemText primary="Collections" />
          </ListItem>
          <Divider />
        </List>
      </div>
      <div className={classes.page}>{children}</div>
    </Box>
  );
};

export default Layout;
