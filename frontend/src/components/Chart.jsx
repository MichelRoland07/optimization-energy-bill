/**
 * Reusable Chart component using Plotly.js
 */
import React from 'react';
import Plot from 'react-plotly.js';

const Chart = ({ data, layout, config, style }) => {
  const defaultLayout = {
    font: { family: 'Arial, sans-serif', size: 14 },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    autosize: true,
    margin: { l: 60, r: 60, t: 60, b: 60 },
    ...layout,
  };

  const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    ...config,
  };

  const defaultStyle = {
    width: '100%',
    height: '400px',
    ...style,
  };

  return (
    <Plot
      data={data}
      layout={defaultLayout}
      config={defaultConfig}
      style={defaultStyle}
      useResizeHandler={true}
    />
  );
};

export default Chart;
