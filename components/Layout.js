import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import Box from '@material-ui/core/Box';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AddCollectionIcon from '@material-ui/icons/NoteAddOutlined';
import DashboardIcon from '@material-ui/icons/FolderOpenOutlined';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import PageIcon from '@material-ui/icons/ChevronRightOutlined';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { useState } from 'react';
import { Logo } from './icons/Logo';
import { useRouter } from 'next/router';
import { useFetch } from './customHooks/useFetch';

const useStyles = makeStyles((theme) => ({
  drawer: {
    color: 'red',
    width: '60px',
    height: '100vh',
    backgroundColor: '#3f3f3f',
  },
  page: {
    width: 'calc(100vw - 60px)',
  },
  tab: {
    minWidth: '60px',
    width: '60px',
    height: '60px',
  },
  logo: {
    flex: '0 0 auto',
    height: 30,
    width: 30,
    marginRight: theme.spacing(2),
  },
  bottomTab: {
    position: 'absolute',
    bottom: 0,
  },
  tabs: {
    height: '100%',
  },
}));

const routesToName = {
  '/': 'Selecter',
  '/dashboard': 'Collections',
};

const Layout = ({ children }) => {
  const classes = useStyles();
  const router = useRouter();
  const [selectedlink, setSelectedLink] = useState(router.pathname);
  const [isDialog, setIsDialog] = useState(false);
  const { data: version, loading: isVersionLoading } = useFetch('/version');

  const handleLinkSelect = (e, value) => {
    if (Object.keys(routesToName).includes(value)) {
      if (value !== selectedlink) {
        router.push(value);
      }
      return;
    }

    if (value === '/about') {
      setIsDialog(true);
    }
  };

  console.log(version);
  return (
    <Box display="flex" flexDirection="row">
      <div className={classes.drawer}>
        <Tabs
          value={selectedlink}
          onChange={handleLinkSelect}
          orientation="vertical"
          indicatorColor="primary"
          textColor="primary"
          className={classes.tabs}
        >
          <Tab value="/" classes={{ root: classes.tab }} icon={<AddCollectionIcon fontSize="large" />} />
          <Tab value="/dashboard" classes={{ root: classes.tab }} icon={<DashboardIcon fontSize="large" />} />
          <Tab
            value="/about"
            className={classes.bottomTab}
            classes={{ root: classes.tab }}
            icon={<InfoIcon fontSize="large" />}
          />
        </Tabs>
      </div>
      <div className={classes.page}>
        <Box
          display="flex"
          flexDirection="row"
          flex="0 0 auto"
          justifyContent="flex-start"
          alignItems="center"
          px={5}
          py={2}
        >
          <Logo className={classes.logo} />
          <Typography variant="h6" color="textPrimary">
            Pick Chunks
          </Typography>
          <PageIcon />
          <Typography varient="subtitle1" color="textSecondary">
            {routesToName[selectedlink]}
          </Typography>
        </Box>
        <div>{children}</div>
      </div>
      <Dialog
        fullWidth={true}
        open={isDialog}
        onClose={() => {
          setIsDialog(false);
        }}
      >
        <DialogTitle>Pick Chunks</DialogTitle>
        <DialogContent>
          <DialogContentText>Version: {isVersionLoading ? '...' : version.version}</DialogContentText>
          <DialogContentText>
            <Link href="https://github.com/chicho17/pick-chunks" target="_blank">
              Github Respository
            </Link>
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Layout;
