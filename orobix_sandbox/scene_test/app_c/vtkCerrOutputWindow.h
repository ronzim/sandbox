/*=========================================================================

  Program:   Visualization Toolkit
  Module:    vtkCerrOutputWindow.h

  Copyright (c) Ken Martin, Will Schroeder, Bill Lorensen
  All rights reserved.
  See Copyright.txt or http://www.kitware.com/Copyright.htm for details.

     This software is distributed WITHOUT ANY WARRANTY; without even
     the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
     PURPOSE.  See the above copyright notice for more information.

=========================================================================*/
// .NAME vtkCerrOutputWindow - File Specific output window class
// .SECTION Description
// Writes debug/warning/error output to a log file instead of the console.
// To use this class, instantiate it and then call SetInstance(this).
// 

#ifndef __vtkCerrOutputWindow_h
#define __vtkCerrOutputWindow_h

#include "vtkOutputWindow.h"
#include "vtkObjectFactory.h"

class vtkCerrOutputWindow : public vtkOutputWindow
{
public:
  vtkTypeMacro(vtkCerrOutputWindow, vtkOutputWindow);

  static vtkCerrOutputWindow* New();

  virtual void PrintSelf(ostream& os, vtkIndent indent)
  {
    this->Superclass::PrintSelf(os, indent);
    os << indent << "Append: " << (this->Append ? "On" : "Off") << endl;
    os << indent << "Flush: " << (this->Flush ? "On" : "Off") << endl;
  }

  // Description:
  // Put the text into the log file.
  // New lines are converted to carriage return new lines.
  virtual void DisplayText(const char* text)
  {
    if(!text)
    {
      return;
    }

    cerr << text << endl;

    if (this->Flush)
    {
      cerr.flush();
    }
  }

  // Description:
  // Turns on buffer flushing for the output 
  // to the log file.
  vtkSetMacro(Flush, int);
  vtkGetMacro(Flush, int);
  vtkBooleanMacro(Flush, int);

  // Description:
  // Setting append will cause the log file to be
  // opened in append mode.  Otherwise, if the log file exists,
  // it will be overwritten each time the vtkCerrOutputWindow
  // is created.
  vtkSetMacro(Append, int);
  vtkGetMacro(Append, int);
  vtkBooleanMacro(Append, int);

protected:
  vtkCerrOutputWindow()
  {
    this->Append = 0;
    this->Flush = 0;
  }
  virtual ~vtkCerrOutputWindow() {}; 

  int Flush;
  int Append;

private:
  vtkCerrOutputWindow(const vtkCerrOutputWindow&);  // Not implemented.
  void operator=(const vtkCerrOutputWindow&);  // Not implemented.
};

vtkStandardNewMacro(vtkCerrOutputWindow);

#endif
