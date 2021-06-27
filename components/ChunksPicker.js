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
// NEW IMPORTS
import useChildrenChunksQuery from '../hooks/api/useChildrenChunksQuery';

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

//used for SnackBar alert
function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

const ChunksPicker = ({ entryFile, className }) => {
  const classes = useStyles();
  // YET TO IMPLEMENT, used to find all the descendents of a chunk,
  // used in handleEntireSubGraphSelect
  // Implementation from useAllDescendantsChunkQuery.tc can be used I think
  const loadAllDescendantChunks = useCallback(
    () =>
      new Promise((resolve, reject) => {
        reject('yet to implement');
      }),
    []
  );

  // for breadCrumbs and SetCrumbs updates the crumbs so that when we click on intermidiate crumb, list gets updated
  // till that crumb only . Eg [a/b/c/d] clicked on-> b ; updated crumbs[a/b]
  const [crumbs, setCrumbs] = useState([{ filepath: entryFile.filepath, chunkName: 'entry' }]);
  // updates crumbs using setcrumbs as mentioned in declaration of useEffect for [crumbs,setCrumbs]
  const handleCrumbClick = useCallback((e) => {
    e.preventDefault();
    const index = +e.currentTarget.dataset.index;
    setCrumbs((prevCrumbs) => [...prevCrumbs.slice(0, index + 1)]);
  }, []);

  //YET TO IMPLEMENT
  // as i undestand from arguments, we are passing current filePath and getting the cunks for that file
  const { data: childrenChunks } = useChildrenChunksQuery(crumbs[crumbs.length - 1].filepath);

  // used for disabling some activities if something is processing
  const [processing, setProcessing] = useState(false);
  // used for searching a chunk when chunk-name is searched from the textField
  const [keyword, setKeyword] = useState('');
  // Contains the set of all Currently selected Chunks in a Set
  const [selectedChunks, setSelectedChunks] = useState(new Set());

  // Fuzzy-search is npm module which can return the likely to be relevant
  // search arguments even when the argument does not exactly correspond to the desired information.
  const fuzSearch = useMemo(() => {
    return new FuzzySearch(childrenChunks, ['chunkName']);
  }, [childrenChunks]);
  // returns the search results if there is a keyword else, returns all the child chunks
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
  // created a ref named: handleChunkEnterRef, and is used in list of chunks shown, so when we click on a particular
  // chunk it adds this new chunk to crums using setCrumbs. eg [a/b] clicked on c -> [a/b/c]
  const handleChunkEnter = useCallback((e) => {
    // e.currentTarget.dataset is used for list items
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

  const [shouldShowSnackbar, setSnackbarVisibility] = useState(false);
  const hideSnackbar = useCallback(() => setSnackbarVisibility(false), []);
  // used for the copy button and copies all the current content and shows snackbar
  // writes copied content to Clipboard
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

  // useMeasure, returns the height and width of the container referenced with containerRef once its mounted
  const [containerRef, { height, width }] = useMeasure();
  // useMeasure, returns the width of the container referenced with selectedContainerRef once its mounted
  const [selectedContainerRef, { width: selectionBoxWidth }] = useMeasure();
  // Error here : react hooks has unnecessary dependencies
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
          {/*Breadcrumbs are for showing current directory structure, like [Home/Catalog/Accessories] */}
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
                  {chunkName}
                </Typography>
              </Link>
            ))}
            {/*The latest breadcrumb [Accessories] */}
            <Typography variant="h6" color="textPrimary">
              {crumbs[crumbs.length - 1].chunkName}
            </Typography>
          </Breadcrumbs>

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
              {/* FixedSizeList: creates a scrollable list of items;
              itemSize:{Height of item} height:{height of container} width:{width of container} itemCount:{total items}*/}
              <FixedSizeList
                height={height}
                width={width - selectionBoxWidth}
                itemSize={58}
                itemCount={filteredChunks?.length || 0}
                data={windowData}
              >
                {/*Containes styles individual ListItem */}
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
                {/*Created a list of chunk-Chips and uses animation */}
                {[...selectedChunks].map((chunk) => (
                  <motion.div
                    key={chunk}
                    style={{ display: 'inline-block' }}
                    animate={{ scale: 1 }}
                    initial={{ scale: 0.5 }}
                  >
                    {/*Chip is a component which is a small card like element, which can be deleted*/}
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
      {/* Snackbar is used to show alert or messages on screen*/}
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
