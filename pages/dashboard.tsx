import React from 'react';
import Box from '@material-ui/core/Box';
import Layout from '../components/Layout';
import { useFetch } from '../components/customHooks/useFetch';


import Collection from '../components/Collection';

function Dashboard() {
  console.log('------------------Dashborad renders--------------------------');
  const { data: dataReceived, loading: dataLoading } = useFetch('api/collection/list');
  return (
    <Box>
      <Layout>
        <Collection dataReceived={dataReceived} dataLoading={dataLoading} />
      </Layout>
    </Box>
  );
}

export default Dashboard;
