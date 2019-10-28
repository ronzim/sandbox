#ifndef __dataSetsToDataObjects__h__
#define __dataSetsToDataObjects__h__

#include "picojson.h"

#include "vtkDataArray.h"

#include "vtkPolyData.h"
#include "vtkTriangleFilter.h"
#include "vtkPolyDataNormals.h"
#include "vtkImageData.h"
#include "vtkPointData.h"
#include "vtkCellData.h"


void dataArrayToArrayObject(vtkDataArray* dataArray, const std::string& prefix,
                            picojson::object& array, BufferMapType& bufferMap) {

  // std::cout << "dataArrayToArrayObject" << std::endl;

  std::string name = dataArray->GetName();
  std::string key  = prefix + "$" + name;
  std::string type = dataArray->GetDataTypeAsString();

  // std::cout << "settingArrays..." << std::endl;

  array["name"] = picojson::value(name);
  array["type"] = picojson::value(type);
  array["components"] = picojson::value(static_cast<double>(dataArray->GetNumberOfComponents()));
  array["tuples"] = picojson::value(static_cast<double>(dataArray->GetNumberOfTuples()));
  array["key"] = picojson::value(prefix);

  // std::cout << "GetDataSize" << std::endl;

  unsigned long nbytes = dataArray->GetDataSize() * dataArray->GetDataTypeSize();

  // std::cout << "buffer_nbytes " << nbytes << std::endl;

  std::vector<char> buffer(nbytes);

  // std::cout << "ExportToVoidPointer" << std::endl;

  dataArray->ExportToVoidPointer(buffer.data());

  // std::cout << "bufferMap" << std::endl;

  BufferPairType p;
  p.first = type;
  #ifdef linux
  swap(p.second,buffer);
  swap(bufferMap[key],p);
  #else
  p.second.swap(buffer);
  bufferMap[key].swap(p);
  #endif
  // std::cout << "bufferMap_end" << std::endl;
}

void polyDataToSurfaceObject(vtkPolyData* inputPolyData, picojson::object& surface,
                             BufferMapType& bufferMap, picojson::object& arrays)
{

  inputPolyData->BuildCells();

  vtkIdType numberOfCells = inputPolyData->GetNumberOfCells();

  vtkPolyData* polyData = vtkPolyData::New();

  int cellType;
  int numberOfLines = 0;
  bool polyline = false;
  int linesSize = 1;

  surface["ncells"] = picojson::value(0.0);
  surface["npoints"] = picojson::value(0.0);

  // TODO: points, lines, coordinates into buffer map
  for (vtkIdType i=0; i<numberOfCells; i++)
  {
    cellType = inputPolyData->GetCellType(i);
    if (cellType == 4){
      polyline = true;
      break;
    }
  }

  vtkIdType npts, *pts;
  vtkIdType ntriangles;

  if (polyline == true) {
    polyData->DeepCopy(inputPolyData);

    surface["kind"] = picojson::value("polyLine");

    std::vector<float> points;
    std::vector<unsigned int> lines;

    for (vtkIdType i=0; i<numberOfCells; i++)
      {
        cellType = polyData->GetCellType(i);
        if (cellType == 4){
          polyData->GetCellPoints(i,npts,pts);
          linesSize += npts+1;
        }
      }

    lines.reserve(linesSize+1);

    for (vtkIdType i=0; i<numberOfCells; i++)
      {
        cellType = polyData->GetCellType(i);

        if (cellType == 4){
          numberOfLines++;
          polyData->GetCellPoints(i,npts,pts);
          lines.push_back(npts);

          for (vtkIdType j=0; j<npts; j++)
            {
              lines.push_back(pts[j]);
            }
        }
      }

    lines.push_back(numberOfLines);
    vtkIdType numberOfPoints = polyData->GetNumberOfPoints();
    points.resize(3*numberOfPoints);

    for (vtkIdType i=0; i<numberOfPoints; i++)
    {
      double* point = polyData->GetPoint(i);
      points[3*i  ] = point[0];
      points[3*i+1] = point[1];
      points[3*i+2] = point[2];
    }

   std::vector<char> pointsBytes(points.size() * sizeof(float));
   std::vector<char> linesBytes(lines.size() * sizeof(unsigned int));

   memcpy(pointsBytes.data(), points.data(), pointsBytes.size());
   memcpy(linesBytes.data(), lines.data(), linesBytes.size());

   BufferPairType pointsPair;
   pointsPair.first = "float";
   #ifdef linux
   swap(pointsPair.second,pointsBytes);
   #else
   pointsPair.second.swap(pointsBytes);
   #endif

   BufferPairType linesPair;
   linesPair.first = "unsigned int";
   #ifdef linux
   swap(linesPair.second,linesBytes);
   #else
   linesPair.second.swap(linesBytes);
   #endif

   #ifdef linux
   swap(bufferMap["points"],pointsPair);
   swap(bufferMap["lines"],linesPair);
   #else
   bufferMap["points"].swap(pointsPair);
   bufferMap["lines"].swap(linesPair);
   #endif

   surface["npoints"] = picojson::value(static_cast<double>(points.size()));
   surface["ncells"] = picojson::value(static_cast<double>(lines.size()));
  }

  //polydata
  else {
    surface["kind"] = picojson::value("surface");

    vtkTriangleFilter* triangleFilter = vtkTriangleFilter::New();
    triangleFilter->SetInputData(inputPolyData);
    triangleFilter->PassVertsOff();
    triangleFilter->PassLinesOff();
    triangleFilter->Update();

    polyData->DeepCopy(triangleFilter->GetOutput());

    triangleFilter->Delete();

    polyData->BuildCells();

    vtkIdType numberOfPoints = polyData->GetNumberOfPoints();

    numberOfCells = polyData->GetNumberOfCells();

    ntriangles = 0;
    for (vtkIdType i=0; i<numberOfCells; i++)
    {
      cellType = polyData->GetCellType(i);
      if (cellType != 5) {
        continue;
      }
      polyData->GetCellPoints(i,npts,pts);
      if (npts != 3) {
        continue;
      }
      ntriangles++;
    }

    surface["npoints"] = picojson::value(static_cast<double>(numberOfPoints));
    surface["ncells"] = picojson::value(static_cast<double>(ntriangles));

    //building coordinates array for threejs buffergeometry
    std::vector<float> coordinates(9 * ntriangles);

    vtkIdType count = 0;
    for (vtkIdType i=0; i<numberOfCells; i++)
    {
      cellType = polyData->GetCellType(i);
      if (cellType != 5) {
        continue;
      }
      polyData->GetCellPoints(i,npts,pts);
      if (npts != 3) {
        continue;
      }
      for (vtkIdType j=0; j<npts; j++) {
        double* point = polyData->GetPoint(pts[j]);
        coordinates[count++] = point[0];
        coordinates[count++] = point[1];
        coordinates[count++] = point[2];
      }
    }

    std::vector<char> coordinatesBytes(coordinates.size() * sizeof(float));
    memcpy(coordinatesBytes.data(), coordinates.data(), coordinatesBytes.size());

    BufferPairType coordinatesPair;
    coordinatesPair.first = "float";
    #ifdef linux
    swap(coordinatesPair.second,coordinatesBytes);
    swap(bufferMap["coordinates"],coordinatesPair);
    #else
    coordinatesPair.second.swap(coordinatesBytes);
    bufferMap["coordinates"].swap(coordinatesPair);
    #endif
  }

  picojson::object pointdata;
  picojson::object celldata;

  bool metadataPointArrays = false;
  bool allPointArrays = false;
  if (arrays["pointData"].is<std::string>()) {
    if (arrays["pointData"].get<std::string>() == "metadata") {
      metadataPointArrays = true;
    }
    else if (arrays["pointData"].get<std::string>() == "all") {
      allPointArrays = true;
    }
  }

  vtkIdType numberOfPointArrays = polyData->GetPointData()->GetNumberOfArrays();
  for(vtkIdType k = 0; k < numberOfPointArrays; k++) {
    vtkDataArray* dataArray = polyData->GetPointData()->GetArray(k);
    const char* name = dataArray->GetName();

    picojson::object array;

    if (!allPointArrays) {
      if (!metadataPointArrays) {
        const picojson::array& reqArrays = arrays["pointData"].get<picojson::array>();
        bool found = false;
        for (int i=0; i<reqArrays.size(); i++) {
          if (reqArrays[i].get<std::string>() == name) {
            found = true;
            break;
          }
        }
        if (!found) {
          continue;
        }
      }
      else {
        picojson::object arrayMetaData;
        arrayMetaData["name"] = picojson::value(name);
        double* range = dataArray->GetRange(-1);
        arrayMetaData["min"] = picojson::value(range[0]);
        arrayMetaData["max"] = picojson::value(range[1]);

        pointdata[name] = picojson::value(arrayMetaData);
        continue;
      }
    }

    if (!polyline) {
      vtkDataArray* bufferDataArray = vtkDataArray::CreateDataArray(dataArray->GetDataType());
      bufferDataArray->SetName(dataArray->GetName());

      bufferDataArray->SetNumberOfComponents(dataArray->GetNumberOfComponents());
      bufferDataArray->SetNumberOfTuples(3*ntriangles);

      vtkIdType count = 0;
      for (vtkIdType i=0; i<numberOfCells; i++)
      {
        cellType = polyData->GetCellType(i);
        if (cellType != 5) {
          continue;
        }
        polyData->GetCellPoints(i,npts,pts);
        if (npts != 3) {
          continue;
        }
        for (vtkIdType j=0; j<npts; j++) {
          bufferDataArray->SetTuple(count++,dataArray->GetTuple(pts[j]));
        }
      }

      dataArrayToArrayObject(bufferDataArray, "pointData", array, bufferMap);
    }
    else {
      dataArrayToArrayObject(dataArray, "pointData", array, bufferMap);
    }

    pointdata[name] = picojson::value(array);
  }

  bool metadataCellArrays = false;
  bool allCellArrays = false;
  if (arrays["cellData"].is<std::string>()) {
    if (arrays["cellData"].get<std::string>() == "metadata") {
      metadataCellArrays = true;
    }
    else if (arrays["cellData"].get<std::string>() == "all") {
      allCellArrays = true;
    }
  }

  vtkIdType numberOfCellArrays = polyData->GetCellData()->GetNumberOfArrays();
  for(vtkIdType k = 0; k < numberOfCellArrays; k++) {
    vtkDataArray* dataArray = polyData->GetCellData()->GetArray(k);
    const char* name = dataArray->GetName();

    if (!allCellArrays) {
      if (!metadataCellArrays) {
        const picojson::array& reqArrays = arrays["cellData"].get<picojson::array>();
        bool found = false;
        for (int i=0; i<reqArrays.size(); i++) {
          if (reqArrays[i].get<std::string>() == name) {
            found = true;
            break;
          }
        }
        if (!found) {
          continue;
        }
      }
      else {
        picojson::object arrayMetaData;
        arrayMetaData["name"] = picojson::value(name);

        double* range = dataArray->GetRange(-1);
        arrayMetaData["min"] = picojson::value(range[0]);
        arrayMetaData["max"] = picojson::value(range[1]);

        celldata[name] = picojson::value(arrayMetaData);
        continue;
      }
    }

    picojson::object array;
    dataArrayToArrayObject(dataArray, "cellData", array, bufferMap);

    celldata[name] = picojson::value(array);
  }

  surface["pointData"] = picojson::value(pointdata);
  surface["cellData"] = picojson::value(celldata);

  polyData->Delete();
}

void STLToSurfaceObject(vtkPolyData* inputPolyData, picojson::object& surface,
                             BufferMapType& bufferMap)
{

  inputPolyData->BuildCells();

  vtkIdType numberOfCells = inputPolyData->GetNumberOfCells();

  vtkPolyData* polyData = vtkPolyData::New();

  int cellType;
  int numberOfLines = 0;
  bool polyline = false;
  int linesSize = 1;

  surface["ncells"] = picojson::value(0.0);
  surface["npoints"] = picojson::value(0.0);

  vtkIdType npts, *pts;
  vtkIdType ntriangles;

  vtkTriangleFilter* triangleFilter = vtkTriangleFilter::New();
  triangleFilter->SetInputData(inputPolyData);
  triangleFilter->PassVertsOff();
  triangleFilter->PassLinesOff();
  triangleFilter->Update();

  polyData->DeepCopy(triangleFilter->GetOutput());

  triangleFilter->Delete();

  polyData->BuildCells();

  vtkIdType numberOfPoints = polyData->GetNumberOfPoints();

  numberOfCells = polyData->GetNumberOfCells();

  ntriangles = 0;
  for (vtkIdType i=0; i<numberOfCells; i++)
  {
    cellType = polyData->GetCellType(i);
    if (cellType != 5) {
      continue;
    }
    polyData->GetCellPoints(i,npts,pts);
    if (npts != 3) {
      continue;
    }
    ntriangles++;
  }

  surface["npoints"] = picojson::value(static_cast<double>(numberOfPoints));
  surface["ncells"] = picojson::value(static_cast<double>(ntriangles));

  //building coordinates array for threejs buffergeometry
  std::vector<float> coordinates(9 * ntriangles);

  vtkIdType count = 0;
  for (vtkIdType i=0; i<numberOfCells; i++)
  {
    cellType = polyData->GetCellType(i);
    if (cellType != 5) {
      continue;
    }
    polyData->GetCellPoints(i,npts,pts);
    if (npts != 3) {
      continue;
    }
    for (vtkIdType j=0; j<npts; j++) {
      double* point = polyData->GetPoint(pts[j]);
      coordinates[count++] = point[0];
      coordinates[count++] = point[1];
      coordinates[count++] = point[2];
    }
  }

  std::vector<char> coordinatesBytes(coordinates.size() * sizeof(float));
  memcpy(coordinatesBytes.data(), coordinates.data(), coordinatesBytes.size());

  BufferPairType coordinatesPair;
  coordinatesPair.first = "float";
  #ifdef linux
  swap(coordinatesPair.second,coordinatesBytes);
  swap(bufferMap["coordinates"],coordinatesPair);
  #else
  coordinatesPair.second.swap(coordinatesBytes);
  bufferMap["coordinates"].swap(coordinatesPair);
  #endif

  polyData->Delete();
}

void imageDataToImageObject(vtkImageData* imageData, picojson::object& image,
                            BufferMapType& bufferMap)
{

  // std::cout << "imageDataToImageObject" << std::endl;

  double* spacing = imageData->GetSpacing();
  double* origin  = imageData->GetOrigin();
  int* extent     = imageData->GetExtent();
  int* dimensions = imageData->GetDimensions();
  image["kind"]   = picojson::value("image");

  // std::cout << "spacingArray" << std::endl;

  picojson::array spacingArray(3);

  spacingArray[0] = picojson::value(spacing[0]);
  spacingArray[1] = picojson::value(spacing[1]);
  spacingArray[2] = picojson::value(spacing[2]);

  image["spacing"] = picojson::value(spacingArray);

  // std::cout << "originArray" << std::endl;

  picojson::array originArray(3);
  originArray[0] = picojson::value(origin[0]);
  originArray[1] = picojson::value(origin[1]);
  originArray[2] = picojson::value(origin[2]);
  image["origin"] = picojson::value(originArray);

  // std::cout << "dimensionsArray" << std::endl;

  picojson::array dimensionsArray(3);
  dimensionsArray[0] = picojson::value(static_cast<double>(dimensions[0]));
  dimensionsArray[1] = picojson::value(static_cast<double>(dimensions[1]));
  dimensionsArray[2] = picojson::value(static_cast<double>(dimensions[2]));
  image["dimensions"] = picojson::value(dimensionsArray);

  picojson::array extentArray(6);
  extentArray[0] = picojson::value(static_cast<double>(extent[0]));
  extentArray[1] = picojson::value(static_cast<double>(extent[1]));
  extentArray[2] = picojson::value(static_cast<double>(extent[2]));
  extentArray[3] = picojson::value(static_cast<double>(extent[3]));
  extentArray[4] = picojson::value(static_cast<double>(extent[4]));
  extentArray[5] = picojson::value(static_cast<double>(extent[5]));
  image["extent"] = picojson::value(extentArray);

  // std::cout << "scalars" << std::endl;

  vtkDataArray* scalars = imageData->GetPointData()->GetScalars();
  double* range = scalars->GetRange();

  image["level"]  = picojson::value(0.5*(range[1]+range[0]));
  image["window"] = picojson::value(range[1]-range[0]);

  picojson::object array;

  // std::cout << "dataArrayToArrayObject" << std::endl;

  dataArrayToArrayObject(scalars, "pointData", array, bufferMap);

  image["pixels"] = picojson::value(array);
}

#endif
