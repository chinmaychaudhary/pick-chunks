import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeList } from 'react-window';
import useMeasure from 'react-use/lib/useMeasure';

import Image from 'next/image';

import FuzzySearch from 'fuzzy-search';

import { motion } from 'framer-motion';

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
import SaveIcon from '@material-ui/icons/Save';
import { HomeOutlined } from '@material-ui/icons';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Button } from '@material-ui/core';

import SaveCollectionForm from '../components/SaveCollectionForm';
const useStyles = makeStyles((theme) => ({
  rootContainer: {
    cursor: (props) => (props.disabled ? 'not-allowed' : 'default'),
  },
  container: {
    pointerEvents: (props) => (props.disabled ? 'none' : 'all'),
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

const createPostReqOptions = (obj) => {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
};
const ChunksPicker = ({ entryFile, className }) => {
  const classes = useStyles();
  // loads all descendent chunks
  const loadAllDescendantChunks = useCallback(
    (filepath) =>
      new Promise((resolve, reject) => {
        fetch('api/chunks', createPostReqOptions({ path: filepath, getDescendant: true }))
          .then((res) => {
            return res.json();
          })
          .then((res) => {
            const chunks = res.chunks;
            const chunkNames = chunks.map((chunk) => chunk.chunkName);
            resolve(chunkNames);
          })
          .catch((err) => reject(err));
      }),
    []
  );
  // assumption: EntryFile is descided from api/files which has only filename as a parameter, so
  // the initial crumb which is entry file in pick entry, has chunkName set to its relative filepath.
  const [crumbs, setCrumbs] = useState([{ filepath: entryFile?.name, chunkName: entryFile?.name }]);
  useEffect(() => {
    setCrumbs([{ filepath: entryFile?.name, chunkName: entryFile?.name }]);
    setKeyword('');
  }, [entryFile]);

  const handleCrumbClick = useCallback((e) => {
    e.preventDefault();
    const index = +e.currentTarget.dataset.index;
    setCrumbs((prevCrumbs) => [...prevCrumbs.slice(0, index + 1)]);
  }, []);

  // children chunks are used in showing the children chunks of recently selected chunk
  // childrenChunks :[{filepath: string, chunkName: string}]
  const [childrenChunks, setChildrenChunks] = useState(null);
  // isLoading is used to handle empty state of chunks
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  useEffect(() => {
    const path = crumbs[crumbs.length - 1].filepath;
    if (!path) return;
    setChildrenChunks([]);
    setIsLoadingChunks(true);
    // Assumption: used path as key to store the fetched data from API, assuming path is unique for every file as it is
    // use local storage to fetch the data with that path, if its there in localstorage use that , else fetch it and store it.
    const chunksObject = window.sessionStorage.getItem(path);
    const parsedChunksObject = chunksObject ? JSON.parse(chunksObject) : [];
    if (parsedChunksObject?.cached) {
      setChildrenChunks(parsedChunksObject.chunks);
      setIsLoadingChunks(false);
    } else {
      fetch('/api/chunks', createPostReqOptions({ path: path }))
        .then((response) => response.json())
        .then((data) => {
          const chunkWithName = data.chunks;
          setChildrenChunks(chunkWithName);
          setIsLoadingChunks(false);
          // chunkWithName is array of {chunkName,filePath}
          const updatedChunksData = { chunks: chunkWithName, cached: true };
          // save this to local storage
          window.sessionStorage.setItem(path, JSON.stringify(updatedChunksData));
        })
        .catch((err) => alert(err));
    }
  }, [crumbs]);

  // processing is used to handle subgraph add and remove's loading state
  const [processing, setProcessing] = useState(false);
  // used for search chunks fuzzy search variable
  const [keyword, setKeyword] = useState('');
  // set of all selected chunks by user
  const [selectedChunks, setSelectedChunks] = useState(new Set());
  // dialogue to save the collection
  const [isDialog, setIsDialog] = useState(false);

  const fuzSearch = useMemo(() => {
    return new FuzzySearch(childrenChunks, ['chunkName']);
  }, [childrenChunks]);
  const filteredChunks = useMemo(
    () => (keyword ? fuzSearch.search(keyword) : childrenChunks),
    [fuzSearch, keyword, childrenChunks]
  );

  // chunks filtered for search chunks
  const fcRef = useRef(filteredChunks);
  // chunks selected by user in search chunks
  const selectedChunksRef = useRef(selectedChunks);
  // handling chunks processing of adding and removing subgraphs
  const processingRef = useRef(processing);
  fcRef.current = filteredChunks;
  selectedChunksRef.current = selectedChunks;
  processingRef.current = processing;

  const handleChunkEnter = useCallback((e) => {
    // e.currentTarget.dataset is used for list items to get the item
    const { filepath, chunkName } = e.currentTarget.dataset;
    setCrumbs((prevCrumbs) => prevCrumbs.concat({ filepath, chunkName }));
    setKeyword('');
  }, []);

  // closest returns the closest ancestor of "provided selector string" of the chosen element
  // this is passed to {onDelete on a Chip Component}
  const handleChunkDelete = useCallback((e) => {
    const chunkName = e.currentTarget.closest('[data-container="chunk"]').dataset.chunkName;
    setSelectedChunks((prevChunks) => {
      prevChunks.delete(chunkName);
      return new Set([...prevChunks]);
    });
  }, []);

  // selects the current chunk and appends to the chunks, its used when user uses keyboard input {s}
  const handleSingleChunkSelect = useCallback((chunkName) => {
    setSelectedChunks((prev) => new Set([...prev, chunkName]));
  }, []);

  // selects the subgraph , its used when user uses keyboard input {p}
  const handleEntireSubGraphSelect = useCallback(
    (chunkName, filepath) => {
      const nextChunks = new Set([...selectedChunksRef.current]);
      setProcessing(true);
      loadAllDescendantChunks(filepath).then((descChunks) => {
        [...descChunks, chunkName].forEach((cName) => {
          nextChunks.add(cName);
        });
        setSelectedChunks(nextChunks);
        setProcessing(false);
      });
    },
    [loadAllDescendantChunks]
  );

  // as name says it removes the single chunk, its used when user uses keyboard input {x}
  const handleSingleChunkRemove = useCallback((chunkName) => {
    setSelectedChunks((prev) => {
      prev.delete(chunkName);
      return new Set([...prev]);
    });
  }, []);

  // as name says removes all the child chunks
  const handleEntireSubGraphRemove = useCallback(
    (chunkName, filepath) => {
      const nextChunks = new Set([...selectedChunksRef.current]);
      setProcessing(true);
      loadAllDescendantChunks(filepath).then((descChunks) => {
        [...descChunks, chunkName].forEach((cName) => {
          nextChunks.delete(cName);
        });
        setSelectedChunks(nextChunks);
        setProcessing(false);
      });
    },
    [loadAllDescendantChunks]
  );
  // if item is chosen and also key is pressed,take action if required
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

  // fired when the checkbox in Chunk-item from itemList is clicked
  const handleCheckboxToggle = useCallback(
    (e) => {
      // used to stop onClick propogation to parent which leads to selecting that chunk in checkbox as well as moving to that chunk
      // as now that chunk is selected as well
      e.stopPropagation();
      const { filepath, chunkName, checked } = e.currentTarget.dataset;
      if (checked === '0') {
        return e.metaKey ? handleEntireSubGraphSelect(chunkName, filepath) : handleSingleChunkSelect(chunkName);
      }

      return e.metaKey ? handleEntireSubGraphRemove(chunkName, filepath) : handleSingleChunkRemove(chunkName);
    },
    [handleSingleChunkSelect, handleEntireSubGraphSelect, handleSingleChunkRemove, handleEntireSubGraphRemove]
  );

  // as name says removes all selected chunks, resets the chunk-Set
  const handleDeselectAll = useCallback(() => {
    setSelectedChunks(new Set());
  }, [setSelectedChunks]);

  const [shouldShowSnackbar, setSnackbarVisibility] = useState(false);
  const snackBarMessage = useRef('');
  const hideSnackbar = useCallback(() => setSnackbarVisibility(false), []);
  const handleCopy = useCallback(() => {
    //eslint-disable-next-line
    snackBarMessage.current = `${selectedChunks.size} chunks copied`;
    navigator.clipboard?.writeText([...selectedChunks].join()).then(() => setSnackbarVisibility(true));
  }, [selectedChunks]);

  // used to not create the function again and again.
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
    const { filepath, chunkName } = fcRef.current[index];
    return (
      <motion.div
        key={chunkName}
        animate={{ y: style.top }}
        initial={{ y: style.top - 56 }}
        style={{ top: 0, position: 'absolute', width: '100%' }}
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

  // useMeasure, returns the height and width of the container referenced with containerRef once its mounted
  const [containerRef, { height, width }] = useMeasure();
  // useMeasure, returns the width of the container referenced with selectedContainerRef once its mounted
  const [selectedContainerRef, { width: selectionBoxWidth }] = useMeasure();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const windowData = useMemo(() => ({}), [selectedChunks, processing, filteredChunks]);

  const [isChildrenChunks, setIsChildrenChunks] = useState(false);
  useEffect(() => {
    setIsChildrenChunks(childrenChunks != null && childrenChunks.length > 0);
  }, [childrenChunks]);

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
          {/* 1. Breadcrumbs are for showing current directory structure, like [Home/Catalog/Accessories] */}
          <Breadcrumbs aria-label="breadcrumb" flex="0 0 auto" style={{ marginBottom: '8px' }}>
            {/*All the breadcrumbs before the current one [Home/Catalog] */}
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
                {chunkName !== entryFile?.name ? (
                  <Typography variant="subtitle1" color="secondary">
                    {chunkName}
                  </Typography>
                ) : (
                  <HomeOutlined />
                )}
              </Link>
            ))}
            {/*The latest breadcrumb [Accessories] */}
            <Typography variant="subtitle1" color="textPrimary">
              {crumbs[crumbs.length - 1].chunkName !== entryFile?.name ? (
                <Typography variant="subtitle1">{crumbs[crumbs.length - 1].chunkName}</Typography>
              ) : (
                <HomeOutlined />
              )}
            </Typography>
          </Breadcrumbs>
          {/* 2. Search Chunks and copy, delete save collection options */}
          <Box display="flex" alignItems="flex-end">
            {/*input field for to search for a chunk*/}
            <TextField
              variant="outlined"
              flex="0 0 auto"
              style={{
                marginBottom: '20px',
                width: '35%',
              }}
              label="Search Chunks"
              disabled={!isChildrenChunks}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            {/*Buttons to perform delete or copy on above TextField, save collection for selected chunks */}
            <Box ml="auto">
              <IconButton disabled={!selectedChunks.size} onClick={handleCopy} aria-label="copy">
                <FileCopyOutlinedIcon />
              </IconButton>
              <IconButton disabled={!selectedChunks.size} onClick={handleDeselectAll} aria-label="deselect all">
                <DeleteOutlineIcon />
              </IconButton>
              <IconButton
                disabled={!selectedChunks.size}
                onClick={() => {
                  setIsDialog(true);
                }}
                aria-label="save collection"
              >
                <SaveIcon />
              </IconButton>
            </Box>
          </Box>
          {/* 3. List of chunks and chips */}
          <Box
            mt={1}
            ref={containerRef}
            display="flex"
            flex="1"
            minHeight="40vh"
            data-boo="1"
            width="100%"
            maxWidth="100%"
          >
            <div
              className={classes.listRoot}
              style={{
                height,
                width: width - selectionBoxWidth,
              }}
            >
              {/* FixedSizeList: creates a scrollable list of items;
              itemSize:{Height of item} height:{height of container} width:{width of container} itemCount:{total items}*/}
              {isChildrenChunks ? (
                <FixedSizeList
                  height={height}
                  width={width - selectionBoxWidth}
                  itemSize={58}
                  itemCount={filteredChunks?.length || 0}
                  data={windowData}
                >
                  {/*Containes styled individual ListItem */}
                  {ListItemContainer}
                </FixedSizeList>
              ) : (
                <Box
                  height="100%"
                  width={width - selectionBoxWidth}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  textAlign="center"
                >
                  {!isLoadingChunks ? (
                    <>
                      <Image src="/empty.svg" height={200} width={200} alt="no chunks"></Image>
                      <Typography>No Chunks found!</Typography>
                    </>
                  ) : (
                    <>
                      <Image src="/loading.svg" height={200} width={200} alt="loading"></Image>
                      <Typography>Loading...</Typography>
                    </>
                  )}
                </Box>
              )}
            </div>
            <Box ref={selectedContainerRef} flex="1">
              <Box
                ref={selectedContainerRef}
                className={classes.selectedChunks}
                justifyContent="center"
                flexWrap="wrap"
                borderRadius="borderRadius"
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
        message={snackBarMessage.current}
      />
      <SaveCollectionForm
        isDialog={isDialog}
        setIsDialog={setIsDialog}
        selectedChunks={selectedChunks}
        snackBarMessage={snackBarMessage}
        setSnackbarVisibility={setSnackbarVisibility}
      />
    </Box>
  ) : (
    <></>
  );
};

export { ChunksPicker };
