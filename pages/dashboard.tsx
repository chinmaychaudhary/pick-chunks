import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Navbar from '../components/Navbar';
import { flexbox } from '@material-ui/system';

const useStyles = makeStyles({
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  collectionContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  halfBox: {
    width: '40%',
    height: '80vh',
    border: '1px solid red',
    justifyContent: 'spaceBetween',
  },
  list: {
    width: '100%',
    maxWidth: 360,
    overflow: 'auto',
    maxHeight: 300,
  },
});

import { useFetch } from '../components/customHooks/useFetch';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { FixedSizeList } from 'react-window';
import { Checkbox, List } from '@material-ui/core';

function Dashboard() {
  const classes = useStyles();
  const { data: dataReceived, loading: dataLoading } = useFetch('api/collection/list');

  const [chosenItem, setChosenItem] = useState({
    name: '',
  });

  const chooseCollection = (name: string) => {
    setChosenItem({
      name: name,
    });
  };

  return (
    <Box className={classes.mainContent} p={5}>
      <Navbar />
      {dataLoading ? null : (
        <>
          <Box display="flex" flexDirection="row" justifyContent="space-between" m={1} bgcolor="background.paper">
            <Box>
              Hi, list Box
              <List className={classes.list} component="nav">
                {!dataReceived ? (
                  <div>Make Collections To See Them Here</div>
                ) : (
                  dataReceived.map((item: { name: string }) => (
                    <ListItem
                      button
                      onClick={() => {
                        chooseCollection(item.name);
                      }}
                      key={item.name}
                      data-name={item.name}
                      data-checked={chosenItem.name === item.name ? '1' : '0'}
                      selected={chosenItem.name === item.name}
                    >
                      <ListItemText primary={item.name} />
                    </ListItem>
                  ))
                )}
              </List>
            </Box>
            <Box overflow="auto">Hi, preview Box</Box>
          </Box>
        </>
      )}
    </Box>
  );
}

export default Dashboard;
