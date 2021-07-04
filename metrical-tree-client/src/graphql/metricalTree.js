import { gql } from '@apollo/client';

export const UPLOAD_METRICAL_TREE_FILE = gql`
  mutation UploadMetricalTreeFile($file: File!) {
    upload(file: $file)
      @rest(
        method: "POST"
        type: "Upload"
        path: "/uploads/metricaltree"
        bodySerializer: "fileEncode"
        bodyKey: "file"
      ) {
      id
      filename
      TTLSeconds
    }
  }
`;
