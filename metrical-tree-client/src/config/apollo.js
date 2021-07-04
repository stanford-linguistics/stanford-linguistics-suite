import { ApolloClient, InMemoryCache } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';

const apiUrl = process.env.REACT_APP_API_URL;
const restLink = new RestLink({
  uri: apiUrl,
  bodySerializers: {
    fileEncode: (file, headers) => {
      const formData = new FormData();
      formData.append('file', file);
      headers.set('Accept', '*/*');
      return {
        body: formData,
        headers,
      };
    },
  },
});

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: restLink,
});
