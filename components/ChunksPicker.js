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
import SaveIcon from '@material-ui/icons/Save';
import Grid from '@material-ui/core/Grid';

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
  // YET TO IMPLEMENT, used to find all the descendents of a chunk,
  // used in handleEntireSubGraphSelect
  const loadAllDescendantChunks = useCallback(
    () =>
      new Promise((resolve, reject) => {
        reject('yet to implement');
      }),
    []
  );

  const [crumbs, setCrumbs] = useState([{ filepath: entryFile?.name }]);
  useEffect(() => {
    setCrumbs([{ filepath: entryFile?.name }]);
    setKeyword('');
  }, [entryFile]);
  const handleCrumbClick = useCallback((e) => {
    e.preventDefault();
    const index = +e.currentTarget.dataset.index;
    setCrumbs((prevCrumbs) => [...prevCrumbs.slice(0, index + 1)]);
  }, []);

  const [childrenChunks, setChildrenChunks] = useState(null);
  useEffect(() => {
    const path = crumbs[crumbs.length - 1].filepath;
    if (!path) return;
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: path }),
    };
    console.log('FETCH CALLED WITH PATH:', path);
    fetch('/api/chunks', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        const chunkWithName = data.chunks.map((item) => {
          return {
            filepath: item,
          };
        });
        setChildrenChunks(chunkWithName);
        console.log('FETCH CALLED:', chunkWithName);
      })
      .catch((err) => alert(err));
  }, [crumbs]);

  const [processing, setProcessing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedChunks, setSelectedChunks] = useState(new Set());

  const fuzSearch = useMemo(() => {
    return new FuzzySearch(childrenChunks, ['filepath']);
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
    // e.currentTarget.dataset is used for list items
    const { filepath } = e.currentTarget.dataset;
    setCrumbs((prevCrumbs) => prevCrumbs.concat({ filepath }));
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

  // FROM HERE STILL REMAINING
  // selects the current chunk and appends to the chunks, its used when user uses keyboard input {s}
  const handleSingleChunkSelect = useCallback((chunkName) => {
    setSelectedChunks((prev) => new Set([...prev, chunkName]));
  }, []);
  // selects the subgraph , its used when user uses keyboard input {p}
  const handleEntireSubGraphSelect = useCallback(
    (chunkName, filepath) => {
      //DID NOT UNDERSTAND HOW IS IT WORKING ? as it should load descendents but its taking all the current chunks
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
  // as name says it removes the single chunk, its used when user uses keyboard input {x}
  const handleSingleChunkRemove = useCallback((chunkName) => {
    setSelectedChunks((prev) => {
      prev.delete(chunkName);
      return new Set([...prev]);
    });
  }, []);

  // as name says removes all the child chunks and also undetstood this code
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
      // WHY stopPropogation is used ??
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

  // TILL HERE
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
    // HERE chunkName and filepath are extracted ,
    // so we will now remove chunkName, as its not used in api
    const { /*chunkName,*/ filepath } = fcRef.current[index];
    return (
      <motion.div
        key={/*chunkName*/ filepath}
        animate={{ y: style.top }}
        initial={{ y: style.top - 56 }}
        style={{ top: 0, position: 'absolute', width: '100%' }}
        // layoutTransition={spring}
      >
        <ListItem
          button
          data-checked={selectedChunksRef.current.has(/*chunkName*/ filepath) ? '1' : '0'}
          data-chunk-name={/*chunkName*/ filepath}
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
              'aria-labelledby': /*chunkName*/ filepath,
              'data-checked': selectedChunksRef.current.has(/*chunkName*/ filepath) ? '1' : '0',
              'data-chunk-name': /*chunkName*/ filepath,
              'data-filepath': filepath,
              onClick: handleCheckboxToggleRef.current,
            }}
            checked={selectedChunksRef.current.has(/*chunkName*/ filepath)}
          />
          <ListItemText primary={/*chunkName*/ filepath} />
          <ChevronRightIcon edge="end" />
        </ListItem>
      </motion.div>
    );
  }, []);

  // useMeasure, returns the height and width of the container referenced with containerRef once its mounted
  const [containerRef, { height, width }] = useMeasure();
  // useMeasure, returns the width of the container referenced with selectedContainerRef once its mounted
  const [selectedContainerRef, { width: selectionBoxWidth }] = useMeasure();
  // Error here : react hooks has unnecessary dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const windowData = useMemo(() => ({}), [selectedChunks, processing, filteredChunks]);

  // HANDLE SAVE COLLECTION STARTS FROM HERE
  const handleSaveCollection = (e) => {
    e.preventDefault();
    const collectionData = {
      name: collectionName,
      description: collectionDescription,
      chunks: [...selectedChunks],
    };
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectionData),
    };
    console.log(collectionData);
    fetch('/api/collection/add', requestOptions)
      .then((response) => console.log(response.json()))
      .catch((err) => alert(err));

    console.log('Save Button Clicked');
  };

  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

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
                <Typography variant="h6" color="secondary">
                  {/*chunkName*/ filepath}
                </Typography>
              </Link>
            ))}
            {/*The latest breadcrumb [Accessories] */}
            <Typography variant="h6" color="textPrimary">
              {crumbs[crumbs.length - 1].filepath}
            </Typography>
          </Breadcrumbs>
          {/* 2. Search Chunks and copy delete options */}
          <Box display="flex" alignItems="flex-end">
            {/*input field for to search for a chunk*/}
            <TextField
              variant="outlined"
              flex="0 0 auto"
              style={{ marginBottom: '20px', width: '35%' }}
              label="Search Chunks"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            {/*Buttons to perfoem delete or copy on above TextField */}
            <Box ml="auto">
              {/*Copy Button*/}
              <IconButton disabled={!selectedChunks.size} onClick={handleCopy} aria-label="copy">
                <FileCopyOutlinedIcon />
              </IconButton>
              {/*Delete Button*/}
              <IconButton disabled={!selectedChunks.size} onClick={handleDeselectAll} aria-label="deselect all">
                <DeleteOutlineIcon />
              </IconButton>
              <IconButton disabled={!selectedChunks.size} onClick={handleSaveCollection} aria-label="save collection">
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
            <div className={classes.listRoot} style={{ height, width: width - selectionBoxWidth }}>
              {/* FixedSizeList: creates a scrollable list of items;
              itemSize:{Height of item} height:{height of container} width:{width of container} itemCount:{total items}*/}
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
                <form>
                  <Grid container spacing={3}>
                    <Grid item xs={4}>
                      <TextField
                        label="Name"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        variant="outlined"
                        fullWidth={true}
                        required
                        error={collectionName.length ? false : true}
                      />
                    </Grid>
                    <Grid item xs>
                      <TextField
                        label="Description"
                        variant="outlined"
                        fullWidth={true}
                        value={collectionDescription}
                        onChange={(e) => setCollectionDescription(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </form>
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
