import React, { useCallback, useState, useRef, useEffect } from 'react';

import Popover from '@material-ui/core/Popover';
import IconButton from '@material-ui/core/IconButton';
import KeyboardOutlinedIcon from '@material-ui/icons/KeyboardOutlined';
import Typography from '@material-ui/core/Typography';
import Skeleton from '@material-ui/lab/Skeleton';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import { EntryFilePicker } from '../components/EntryFilePicker';
import { ChunksPicker } from '../components/ChunksPicker';
import Layout from '../components/Layout';
import { useLocalStorage } from '../components/customHooks/useLocalStorage';

const useStyles = makeStyles((theme) => ({
  flexNone: { flex: '0 0 auto' },
  flex1: { flex: '1', minHeight: '0' },
  shortcutIcon: { flex: '0 0 auto', position: 'absolute', top: theme.spacing(1), right: theme.spacing(2) },
  popover: {
    width: '350px',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  shortcutCmd: {
    width: '100px',
    flex: '0 0 auto',
    fontWeight: 700,
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
}));

const clickInfo = [
  {
    cmd: 'Click',
    desc: 'Select/Deselect',
  },
  {
    cmd: '⌘ + Click',
    desc: 'Select/Deselect Subgraph',
  },
];
const shortcutsInfo = [
  {
    cmd: 's',
    desc: 'Select',
  },
  {
    cmd: 'p',
    desc: 'Select Subgraph',
  },
  {
    cmd: 'x',
    desc: 'Deselect',
  },
  {
    cmd: 'd',
    desc: 'Deselect Subgraph',
  },
];

const relativePath = (path: string, directory: string | any[]) => {
  const rel = path.substring(directory.length + 1);
  return rel;
};

function Add() {
  const classes = useStyles();

  const btnRef = useRef(null);
  const [showPopover, setPopoverVisibility] = useState(false);
  const handleShortcutClick = useCallback(() => {
    setPopoverVisibility(true);
  }, []);
  const hideShortcutPopover = useCallback(() => {
    setPopoverVisibility(false);
  }, []);

  const [entryFile, setEntryFile] = useState({ filepath: '', name: '' });
  const [dataLoading, setDataLoading] = useState(true);
  const [storedFiles, setStoredFiles] = useLocalStorage('files', []);
  useEffect(() => {
    if (!storedFiles.length) {
      setDataLoading(true);
      fetch('api/files')
        .then((res) => res.json())
        .then((dataReceived) => {
          if (dataReceived) {
            var files: { filepath: any; name: string }[] = [];
            (dataReceived as any).files.forEach((item: any) => {
              const relPath = relativePath(item, (dataReceived as any)?.directory);
              files.push({
                filepath: item,
                name: relPath,
              });
            });
            setStoredFiles(files); // fetched data stored in localstorage
            setEntryFile(files[0]);
            setDataLoading(false);
          }
        });
    } else {
      setEntryFile(storedFiles[0]); // set entry file to first file
      setDataLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Layout>
        <Box className={classes.mainContent} p={5}>
          <div>
            <IconButton
              onClick={handleShortcutClick}
              ref={btnRef}
              aria-label="shortcuts"
              className={classes.shortcutIcon}
            >
              <KeyboardOutlinedIcon fontSize="large" />
            </IconButton>
            <Popover
              id="shortcuts"
              open={showPopover}
              anchorEl={btnRef.current}
              onClose={hideShortcutPopover}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              <List component="nav" className={classes.popover} aria-label="shortcuts popover">
                {clickInfo.map(({ cmd, desc }, index) => (
                  <ListItem key={cmd} divider={index === clickInfo.length - 1}>
                    <Box display="flex" alignItems="center" flex="1">
                      <ListItemText className={classes.shortcutCmd}>
                        <Typography color="secondary">
                          <Box component="span">{cmd}</Box>
                        </Typography>
                      </ListItemText>
                      <ListItemText primary={desc} />
                    </Box>
                  </ListItem>
                ))}
                {shortcutsInfo.map(({ cmd, desc }, index) => (
                  <ListItem key={cmd}>
                    <Box display="flex" alignItems="center" flex="1">
                      <ListItemText className={classes.shortcutCmd}>
                        <Typography color="secondary">{cmd}</Typography>
                      </ListItemText>
                      <ListItemText primary={desc} />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Popover>
          </div>
          {dataLoading ? (
            <Typography component="div" variant="h4">
              <Skeleton />
            </Typography>
          ) : (
            <>
              <EntryFilePicker
                className={classes.flexNone}
                entryFile={entryFile}
                onEntryFileChange={setEntryFile}
                allFiles={storedFiles}
              />
              <ChunksPicker className={classes.flex1} entryFile={entryFile} />
            </>
          )}
        </Box>
      </Layout>
    </Box>
  );
}

export default Add;
