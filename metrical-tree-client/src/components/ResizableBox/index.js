import React from 'react';
import { ResizableBox as ReactResizableBox } from 'react-resizable';

import 'react-resizable/css/styles.css';

export default function ResizableBox({
  children,
  width = '100%',
  height = 300,
  resizable = true,
  style = {},
  className = '',
}) {
  // Get the parent width for proper sizing
  const containerRef = React.useRef(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  React.useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        setContainerWidth(containerRef.current.offsetWidth);
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, []);

  const internalWidth = containerWidth || 600;

  return (
    <div ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
      {resizable ? (
        <ReactResizableBox width={internalWidth} height={height}>
          <div
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,.08)',
              borderRadius: '4px',
              ...style,
              width: '100%',
              height: '100%',
              minWidth: '100%',
            }}
            className={className}>
            {children}
          </div>
        </ReactResizableBox>
      ) : (
        <div
          style={{
            width: '100%',
            height: `${height}px`,
            boxShadow: '0 4px 12px rgba(0,0,0,.08)',
            borderRadius: '4px',
            ...style,
          }}
          className={className}>
          {children}
        </div>
      )}
    </div>
  );
}
