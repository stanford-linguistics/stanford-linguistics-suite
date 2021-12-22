import React, { forwardRef } from 'react';
import { Typography } from '@material-ui/core';
import { Chart } from 'react-charts';
import ResizableBox from 'components/ResizableBox';

export const ResultsGraph = forwardRef(({ model }, ref) => {
  const data = model?.value ? model.value : [];
  const primaryAxis = React.useMemo(
    () => ({
      getValue: (datum) => datum.primary,
    }),
    []
  );

  const secondaryAxis = React.useMemo(
    () => [
      {
        getValue: (datum) => datum.secondary,
      },
    ],
    []
  );

  return (
    <div className="resultsGraph" ref={ref}>
      {' '}
      <Typography>{model?.label ?? ''}</Typography>
      {model && primaryAxis && secondaryAxis && (
        <ResizableBox>
          <Chart
            options={{
              data,
              primaryAxis,
              secondaryAxes: secondaryAxis,
            }}
          />
        </ResizableBox>
      )}
    </div>
  );
});

export default ResultsGraph;
