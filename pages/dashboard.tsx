import React from 'react';

import Box from '@material-ui/core/Box';
import Skeleton from '@material-ui/lab/Skeleton';

import Layout from '../components/Layout';
import { useFetch } from '../components/customHooks/useFetch';
import Collection from '../components/Collection';

function Dashboard() {
  const { data: dataReceived, loading: dataLoading } = useFetch('/api/collection/list');
  return (
    <Box>
      <Layout>{dataLoading ? <Skeleton /> : <Collection dataReceived={dataReceived} />}</Layout>
    </Box>
  );
}

export default Dashboard;
