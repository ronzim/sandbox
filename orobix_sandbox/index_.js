// var Common = require('./Common');
// import Filters from './Filters';
// import Imaging from './Imaging';
// import Interaction from './Interaction';
// import IO from './IO';
// import Rendering from './Rendering';
// import VTKProxy from './Proxy';
// import Widgets from './Widgets';

// var macro = require('./macro.js');
var macro = require('/Users/orobix/Projects/sandbox/orobix_sandbox/macro.js');
var vtk = require('/Users/orobix/Projects/sandbox/orobix_sandbox/macro.js');
var LandmarkTransform = require('/Users/orobix/Projects/sandbox/orobix_sandbox/landmarkTransform.js');
var Points = require('/Users/orobix/Projects/sandbox/orobix_sandbox/points.js');

// vtk.Common = Common;
// vtk.Filters = Filters;
// vtk.Imaging = Imaging;
// vtk.Interaction = Interaction;
// vtk.IO = IO;
// vtk.Proxy = VTKProxy;
// vtk.Rendering = Rendering;
// vtk.Widgets = Widgets;

vtk.mtime = macro.getCurrentGlobalMTime;
vtk.macro = macro;
vtk.vtkLandmarkTransform = LandmarkTransform;
vtk.vtkPoints = Points;

// Expose vtk to global scope without exporting it so nested namespace
// do not pollute the global one.
window.vtk = vtk;
