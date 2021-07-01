import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import FuzzySearch from 'fuzzy-search';
import { FixedSizeList } from 'react-window';
import { motion } from 'framer-motion';

import useMeasure from 'react-use/lib/useMeasure';

import { makeStyles } from '@material-ui/core/styles';

import Link from '@material-ui/core/Link';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import IconButton from '@material-ui/core/IconButton';

import Snackbar from '@material-ui/core/Snackbar';
import Slide from '@material-ui/core/Slide';

import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';

import Chip from '@material-ui/core/Chip';

const useStyles = makeStyles((theme) => ({
  rootContainer: {
    cursor: (props) => (props.disabled ? 'not-allowed' : 'default'),
  },
  container: {
    pointerEvents: (props) => (props.disabled ? 'none' : 'all'),
  },
  output: {
    display: 'flex',
  },
  listRoot: {
    backgroundColor: theme.palette.background.paper,
    flex: '0 0 35%',
    overflow: 'auto',
    minHeight: 0,
  },
  selectedChunks: {
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
  chipRoot: theme.typography.subtitle1,
}));

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const ChunksPicker = ({ entryFile, className }) => {
  const classes = useStyles();

  const loadAllDescendantChunks = useCallback(
    () =>
      new Promise((resolve, reject) => {
        reject('yet to implement');
      }),
    []
  );

  const [crumbs, setCrumbs] = useState([{ filepath: entryFile.filepath, chunkName: 'entry' }]);
  const handleCrumbClick = useCallback((e) => {
    e.preventDefault();
    const index = +e.currentTarget.dataset.index;
    setCrumbs((prevCrumbs) => [...prevCrumbs.slice(0, index + 1)]);
  }, []);

  const { data: childrenChunks } = useChildrenChunksQuery(crumbs[crumbs.length - 1].filepath);

  const [processing, setProcessing] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [selectedChunks, setSelectedChunks] = useState(new Set());

  const fuzSearch = useMemo(() => {
    return new FuzzySearch(childrenChunks, ['chunkName']);
  }, [childrenChunks]);

  const filteredChunks = useMemo(
    () => (keyword ? fuzSearch.search(keyword) : childrenChunks),
    [fuzSearch, keyword, childrenChunks]
  );

  const fcRef = useRef(filteredChunks);
  const selectedChunksRef = useRef(selectedChunks);
  const processingRef = useRef(processing);
  fcRef.current = filteredChunks;
  selectedChunksRef.current = selectedChunks;
  processingRef.current = processing;

  const handleChunkEnter = useCallback((e) => {
    const { filepath, chunkName } = e.currentTarget.dataset;
    setCrumbs((prevCrumbs) => prevCrumbs.concat({ filepath, chunkName }));
    setKeyword('');
  }, []);

  const handleChunkDelete = useCallback((e) => {
    const chunkName = e.currentTarget.closest('[data-container="chunk"]').dataset.chunkName;
    setSelectedChunks((prevChunks) => {
      prevChunks.delete(chunkName);
      return new Set([...prevChunks]);
    });
  }, []);

  const handleSingleChunkSelect = useCallback((chunkName) => {
    setSelectedChunks((prev) => new Set([...prev, chunkName]));
  }, []);

  const handleEntireSubGraphSelect = useCallback(
    (chunkName, filepath) => {
      const nextChunks = new Set([...selectedChunksRef.current]);
      setProcessing(true);
      loadAllDescendantChunks(filepath).then((descChunks) => {
        [...descChunks, { chunkName }].forEach(({ chunkName: cName }) => {
          nextChunks.add(cName);
        });
        setSelectedChunks(nextChunks);
        setProcessing(false);
      });
    },
    [loadAllDescendantChunks]
  );

  const handleSingleChunkRemove = useCallback((chunkName) => {
    setSelectedChunks((prev) => {
      prev.delete(chunkName);
      return new Set([...prev]);
    });
  }, []);

  const handleEntireSubGraphRemove = useCallback(
    (chunkName, filepath) => {
      const nextChunks = new Set([...selectedChunksRef.current]);
      setProcessing(true);
      loadAllDescendantChunks(filepath).then((descChunks) => {
        [...descChunks, { chunkName }].forEach(({ chunkName: cName }) => {
          nextChunks.delete(cName);
        });
        setSelectedChunks(nextChunks);
        setProcessing(false);
      });
    },
    [loadAllDescendantChunks]
  );

  const handleItemKeyDown = useCallback(
    (e) => {
      const { filepath, chunkName, checked } = e.currentTarget.dataset;
      const isActive = checked === '1';

      switch (e.key) {
        case 's':
          return isActive ? undefined : handleSingleChunkSelect(chunkName);
        case 'x':
          return isActive ? handleSingleChunkRemove(chunkName) : undefined;
        case 'p':
          return handleEntireSubGraphSelect(chunkName, filepath);
        case 'd':
          return isActive ? handleEntireSubGraphRemove(chunkName, filepath) : undefined;
        default:
          return undefined;
      }
    },
    [handleSingleChunkSelect, handleSingleChunkRemove, handleEntireSubGraphSelect, handleEntireSubGraphRemove]
  );

  const handleCheckboxToggle = useCallback(
    (e) => {
      e.stopPropagation();
      const { filepath, chunkName, checked } = e.currentTarget.dataset;
      if (checked === '0') {
        return e.metaKey ? handleEntireSubGraphSelect(chunkName, filepath) : handleSingleChunkSelect(chunkName);
      }

      return e.metaKey ? handleEntireSubGraphRemove(chunkName, filepath) : handleSingleChunkRemove(chunkName);
    },
    [handleSingleChunkSelect, handleEntireSubGraphSelect, handleSingleChunkRemove, handleEntireSubGraphRemove]
  );

  const handleDeselectAll = useCallback(() => {
    setSelectedChunks(new Set());
  }, [setSelectedChunks]);

  const [shouldShowSnackbar, setSnackbarVisibility] = useState(false);
  const hideSnackbar = useCallback(() => setSnackbarVisibility(false), []);
  const handleCopy = useCallback(() => {
    //eslint-disable-next-line
    navigator.clipboard?.writeText([...selectedChunks].join()).then(() => setSnackbarVisibility(true));
  }, [selectedChunks]);

  const handleChunkEnterRef = useRef(handleChunkEnter);
  const handleItemKeyDownRef = useRef(handleItemKeyDown);
  const handleCheckboxToggleRef = useRef(handleCheckboxToggle);
  handleChunkEnterRef.current = handleChunkEnter;
  handleItemKeyDownRef.current = handleItemKeyDown;
  handleCheckboxToggleRef.current = handleCheckboxToggle;

  const ListItemContainer = useCallback(({ index, style }) => {
    if (!fcRef.current[index]) {
      return null;
    }
    const { chunkName, filepath } = fcRef.current[index];
    return (
      <motion.div
        key={chunkName}
        animate={{ y: style.top }}
        initial={{ y: style.top - 56 }}
        style={{ top: 0, position: 'absolute', width: '100%' }}
        // layoutTransition={spring}
      >
        <ListItem
          button
          data-checked={selectedChunksRef.current.has(chunkName) ? '1' : '0'}
          data-chunk-name={chunkName}
          data-filepath={filepath}
          onClick={handleChunkEnterRef.current}
          disabled={processingRef.current}
          onKeyDown={handleItemKeyDownRef.current}
          data-container="list-item"
        >
          <Checkbox
            tabIndex={-1}
            edge="start"
            inputProps={{
              'aria-labelledby': chunkName,
              'data-checked': selectedChunksRef.current.has(chunkName) ? '1' : '0',
              'data-chunk-name': chunkName,
              'data-filepath': filepath,
              onClick: handleCheckboxToggleRef.current,
            }}
            checked={selectedChunksRef.current.has(chunkName)}
          />
          <ListItemText primary={chunkName} />
          <ChevronRightIcon edge="end" />
        </ListItem>
      </motion.div>
    );
  }, []);

  const [containerRef, { height, width }] = useMeasure();
  const [selectedContainerRef, { width: selectionBoxWidth }] = useMeasure();
  const windowData = useMemo(() => ({}), [selectedChunks, processing, filteredChunks]);

  useEffect(() => {
    setCrumbs([{ filepath: entryFile.filepath, chunkName: 'entry' }]);
    setKeyword('');
  }, [entryFile]);

  return !!crumbs[crumbs.length - 1]?.filepath || !!selectedChunks.size ? (
    <Box mt={2} className={className} display="flex" flexDirection="column">
      <Box display="flex" flex="1" minHeight={0} className={classes.rootContainer} disabled={processing}>
        <Box
          flex="1"
          minHeight={0}
          display="flex"
          flexDirection="column"
          className={classes.container}
          disabled={processing}
        >
          <Breadcrumbs aria-label="breadcrumb" flex="0 0 auto" style={{ marginBottom: '8px' }}>
            {crumbs.slice(0, crumbs.length - 1).map(({ filepath, chunkName }, index) => (
              <Link
                key={filepath}
                color="secondary"
                href=""
                data-filepath={filepath}
                data-chunk-name={chunkName}
                onClick={handleCrumbClick}
                data-index={index}
              >
                <Typography variant="h6" color="secondary">
                  {chunkName}
                </Typography>
              </Link>
            ))}
            <Typography variant="h6" color="textPrimary">
              {crumbs[crumbs.length - 1].chunkName}
            </Typography>
          </Breadcrumbs>
          <Box display="flex" alignItems="flex-end">
            <TextField
              variant="outlined"
              flex="0 0 auto"
              style={{ marginBottom: '20px', width: '35%' }}
              label="Search Chunks"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Box ml="auto">
              <IconButton disabled={!selectedChunks.size} onClick={handleCopy} aria-label="copy">
                <FileCopyOutlinedIcon />
              </IconButton>
              <IconButton disabled={!selectedChunks.size} onClick={handleDeselectAll} aria-label="deselect all">
                <DeleteOutlineIcon />
              </IconButton>
            </Box>
          </Box>
          <Box
            mt={1}
            ref={containerRef}
            display="flex"
            flex="1"
            minHeight={0}
            data-boo="1"
            width="100%"
            maxWidth="100%"
          >
            <div className={classes.listRoot} style={{ height, width: width - selectionBoxWidth }}>
              <FixedSizeList
                height={height}
                width={width - selectionBoxWidth}
                itemSize={58}
                itemCount={filteredChunks?.length || 0}
                data={windowData}
              >
                {ListItemContainer}
              </FixedSizeList>
            </div>
            <Box ref={selectedContainerRef} flex="1">
              <Box
                ref={selectedContainerRef}
                className={classes.selectedChunks}
                justifyContent="center"
                flexWrap="wrap"
                borderRadius="borderRadius"
                // bgcolor="background.paper"
                borderColor="text.primary"
                border={1}
                mx={2}
                p={4}
                height="100%"
                position="sticky"
                top="0"
                overflow="auto"
              >
                {[...selectedChunks].map((chunk) => (
                  <motion.div
                    key={chunk}
                    style={{ display: 'inline-block' }}
                    animate={{ scale: 1 }}
                    initial={{ scale: 0.5 }}
                  >
                    <Chip
                      label={chunk}
                      classes={{ root: classes.chipRoot }}
                      onDelete={handleChunkDelete}
                      variant="outlined"
                      data-chunk-name={chunk}
                      data-chip="1"
                      data-container="chunk"
                    />
                  </motion.div>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={shouldShowSnackbar}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        autoHideDuration={2000}
        onClose={hideSnackbar}
        TransitionComponent={SlideTransition}
        message={`${selectedChunks.size} chunks copied`}
      />
    </Box>
  ) : (
    <></>
  );
};

export { ChunksPicker };
