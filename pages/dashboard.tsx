import React from 'react';

import Box from '@material-ui/core/Box';
import Skeleton from '@material-ui/lab/Skeleton';

import Layout from '../components/Layout';
import Collection from '../components/Collection';
import { useQuery } from 'react-query';
function Dashboard() {
  const fetchCollectionData = async () => {
    const response = await fetch('/api/collection/list');
    const data = await response.json();
    return data;
  };
  const { data: dataReceived, isLoading: dataLoading } = useQuery('/api/collection/list', fetchCollectionData);
  return (
    <Box>
      <Layout>{dataLoading ? <Skeleton /> : <Collection dataReceived={dataReceived} />}</Layout>
    </Box>
  );
}

export default Dashboard;
