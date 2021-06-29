import React, { useCallback, useState, useRef, useEffect } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

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

import { Logo } from '../components/icons/Logo';

const useStyles = makeStyles((theme) => ({
  flexNone: { flex: '0 0 auto' },
  flex1: { flex: '1', minHeight: '0' },
  logo: {
    flex: '0 0 auto',
    height: 44,
    width: 44,
    marginRight: theme.spacing(2),
  },
  shortcutIcon: { flex: '0 0 auto' },
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
  header: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    justifyContent: 'space-between',
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

function App() {
  const classes = useStyles();
  function relativePath(path: string, directory: string | any[]) {
    const rel = path.substring(directory.length);
    return rel;
  }
  const [entryFile, setEntryFile] = useState({ filepath: '', name: '' });
  const [allFiles, setAllFiles] = useState([] as any);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/files');
      const data = await response.json();
      var files: { filepath: any; name: string }[] = [];
      data.files.forEach((item: any) => {
        const relPath = relativePath(item, data.directory);
        files.push({
          filepath: item,
          name: relPath,
        });
      });
      setAllFiles(files);
      setEntryFile(files[0]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (allFiles.length > 0) {
      setLoading(false);
    }
  }, [allFiles])

  const btnRef = useRef(null);
  const [showPopover, setPopoverVisibility] = useState(false);
  const handleShortcutClick = useCallback(() => {
    setPopoverVisibility(true);
  }, []);
  const hideShortcutPopover = useCallback(() => {
    setPopoverVisibility(false);
  }, []);

  return (
    <Box className={classes.mainContent} p={5}>
      <Box className={classes.header} borderRadius={8}>
        <Box display="flex" flexDirection="row" flex="0 0 auto" justifyContent="flex-start" alignItems="flex-start">
          <Logo className={classes.logo} />
          <Typography variant="h5" color="textPrimary">
            Pick Chunks
          </Typography>
        </Box>
        <Box>
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
        </Box>
      </Box>
      {loading ? (
        <Typography component="div" variant="h4">
          <Skeleton />
        </Typography>
      ) : (
        <>
          <EntryFilePicker
            className={classes.flexNone}
            entryFile={entryFile}
            onEntryFileChange={setEntryFile}
            allFiles={allFiles}
          />
          <ChunksPicker className={classes.flex1} entryFile={entryFile} />
        </>
      )}
    </Box>
  );
}

export default App;
