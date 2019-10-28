#ifndef __readPolyData__h__
#define __readPolyData__h__

#include "dataSetsToDataObjects.h"
#include "picojson.h"

#include "vtkDecimatePro.h"
#include "vtkPolyData.h"
#include "vtkXMLPolyDataReader.h"
#include "vtkPolyDataReader.h"
#include "vtkSTLReader.h"

void readPolyData( Store& store, std::string const &path, std::string const &format, std::string const &uri, vtkPolyData* polyData) {

  if ( store.get<vtkPolyData*>(uri) != NULL ) {
    polyData->DeepCopy(store.get<vtkPolyData*>(uri));
  }

  else {
    vtkPolyData* storePolyData = vtkPolyData::New();

    if (format == ".vtp") {
      vtkXMLPolyDataReader* reader = vtkXMLPolyDataReader::New();
      reader->SetFileName(path.c_str());
      reader->Update();
      polyData->DeepCopy(reader->GetOutput());
      reader->Delete();
    }

    if (format == ".vtk") {
      vtkPolyDataReader* reader = vtkPolyDataReader::New();
      reader->SetFileName(path.c_str());
      reader->Update();
      polyData->DeepCopy(reader->GetOutput());
      reader->Delete();
    }

    if (format == ".stl") {
      vtkSTLReader* reader = vtkSTLReader::New();
      reader->SetFileName(path.c_str());
      reader->Update();
      polyData->DeepCopy(reader->GetOutput());
      std::cout << polyData->GetNumberOfCells() << std::endl;
      reader->Delete();
    }

    storePolyData->DeepCopy(polyData);
    store.insert(uri,storePolyData);
    storePolyData->Delete();

  }
}


struct ReadPolyDataFunctor : Functor
{
  virtual void operator()(Store& store, picojson::object& params,
                          picojson::object& out, BufferMapType& bufferMap) const
  {
    std::string format      = params["format"].get<std::string>();
    std::string path        = params["path"].get<std::string>();
    std::string uri         = params["uri"].get<std::string>();
    picojson::object arrays = params["array"].get<picojson::object>();
    bool decimate           = params["decimate"].get<bool>();

    vtkPolyData* polyData = vtkPolyData::New();
    readPolyData(store, path, format, uri, polyData);

    if (decimate) {
      vtkDecimatePro* decimateFilter = vtkDecimatePro::New();
      decimateFilter->SetInputData(polyData);
      decimateFilter->SetTargetReduction(0.5);
      decimateFilter->PreserveTopologyOn();
      decimateFilter->Update();
      polyData->DeepCopy(decimateFilter->GetOutput());
      std::cout << polyData->GetNumberOfCells() << std::endl;
      decimateFilter->Delete();
    }

    // polyDataToSurfaceObject(polyData, out, bufferMap, arrays);
    polyData->Delete();
    out["response"] = picojson::value(true);
  }
};

#endif
