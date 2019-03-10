#include <iostream>
#include <thread>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "map"
#define _UINT32_T
#define _INT32_T

#ifdef _WIN32
#include <io.h>
#include <winsock2.h>
#else
#include "crisscross/tcpsocket.h"
#endif

#ifdef linux
#include <sstream>
namespace std {
    std::string to_string(size_t n) {
        std::ostringstream s;
        s << n;
        return s.str();
    }
}
#endif

#include "picojson.h"

#include "vtkFileOutputWindow.h"

#include "functors.h"

#include "readPolyData.h"

#include "vtkCerrOutputWindow.h"

#ifdef _WIN32
#else
using namespace CrissCross;
using namespace CrissCross::Network;
#endif

uint32_t pad_size(uint32_t size)
{
  return (size / 8 + (size % 8 ? 1 : 0)) * 8;
}

int main (int argc, char* argv[]) {

  vtkCerrOutputWindow* myOutputWindow = vtkCerrOutputWindow::New();
  vtkOutputWindow::SetInstance(myOutputWindow);

  Functors functors;

  functors.registerFunctor<ReadPolyDataFunctor>("readPolyData");

  std::string port_arg = argv[1];

  #ifdef _WIN32

    WSADATA wsa;
    SOCKET s , new_socket;
    struct sockaddr_in server , client;
    int c;
    char *message;

    // printf("\nInitialising Winsock...");
    if (WSAStartup(MAKEWORD(2,2),&wsa) != 0)
    {
        //printf("Failed. Error Code : %d",WSAGetLastError());
        return 1;
    }

    // printf("Initialised.\n");

    //Create a socket
    if((s = socket(AF_INET , SOCK_STREAM , 0 )) == INVALID_SOCKET)
    {
        // printf("Could not create socket : %d" , WSAGetLastError());
    }

    // printf("Socket created.\n");

    //Prepare the sockaddr_in structure
    server.sin_family = AF_INET;
    server.sin_addr.s_addr = INADDR_ANY;
    server.sin_port = htons(std::atoi(port_arg.c_str()));

    //Bind
    if( bind(s ,(struct sockaddr *)&server , sizeof(server)) == SOCKET_ERROR)
    {
        // printf("Bind failed with error code : %d" , WSAGetLastError());
        exit(EXIT_FAILURE);
    }

    // printf("Bind done.\n");

    //Listen to incoming connections
    listen(s , 3);

    //Accept and incoming connection
    // printf("Waiting for incoming connections...\n");

    c = sizeof(struct sockaddr_in);
    int recv_size;
    char server_reply[200000];

    Store store;

    while( (new_socket = accept(s, (struct sockaddr *)&client, &c)) != INVALID_SOCKET )
    {
        // printf("Connection accepted\n");

        while ((recv_size = recv(new_socket, server_reply , 200000 , 0)) > 0)
        {
          //printf("recv succeeded with size %d\n",recv_size);

          picojson::value v;
          std::string err = picojson::parse(v, server_reply);

          if (! err.empty()) {
            std::cerr << err << std::endl;
          }

          if (! v.is<picojson::object>()) {
            continue;
          }

          picojson::object obj = v.get<picojson::object>();
          picojson::object out;
          BufferMapType bufferMap;

          std::string functionName = obj["function"].get<std::string>();
          picojson::object params = obj["parameters"].get<picojson::object>();

          functors[functionName](store, params, out, bufferMap);

          // std::cout << functionName << std::endl;

          picojson::object jsonObj;
          picojson::object offsets;

          // std::cout << "MAIN: BufferMapType" << std::endl;

          uint32_t data_size = 0;
          uint32_t offset = 0;
          for(BufferMapType::iterator it = bufferMap.begin(); it != bufferMap.end(); it++) {
            uint32_t size = (it->second).second.size();
            picojson::object offsetEntry;
            offsetEntry["type"] = picojson::value((it->second).first);
            offsetEntry["offset"] = picojson::value(static_cast<double>(offset));
            offsetEntry["length"] = picojson::value(static_cast<double>(size));
            offsets[it->first] = picojson::value(offsetEntry);
            uint32_t paddedSize = pad_size(size);
            data_size += paddedSize;
            offset += paddedSize;
          }

          jsonObj["arrays"] = picojson::value(offsets);
          jsonObj["data"] = picojson::value(out);

          // std::cout << "MAIN: json" << std::endl;

          std::string json = picojson::value(jsonObj).serialize();

          const unsigned int header_el_size = sizeof(uint32_t);

          uint32_t json_size = json.size();

          uint32_t hjson_size = 3*header_el_size + json_size;
          uint32_t padded_hjson_size = pad_size(hjson_size);
          unsigned int size = padded_hjson_size + data_size;

          std::vector<char> buffer(size);

          // std::cout << "MAIN: memcpy buffer" << std::endl;

          memcpy(buffer.data(), &size, header_el_size);
          memcpy(buffer.data() + header_el_size, &json_size, header_el_size);
          memcpy(buffer.data() + 2*header_el_size, &padded_hjson_size, header_el_size);
          memcpy(buffer.data() + 3*header_el_size, json.data(), json_size);

          offset = 0;

          // std::cout << "MAIN: BufferMap iterator" << std::endl;

          for(BufferMapType::iterator it = bufferMap.begin(); it != bufferMap.end(); it++) {
            uint32_t buffer_size = (it->second).second.size();
            memcpy(buffer.data() + padded_hjson_size + offset, (it->second).second.data(), buffer_size);
            offset += pad_size(buffer_size);
          }


          std::cout << "__done__" << std::endl;

          // delete[] server_reply;

          send(new_socket, buffer.data(), buffer.size(), 0 );
          closesocket(new_socket);
        }

        //send(new_socket , message , strlen(message) , 0);
    }

    if (new_socket == INVALID_SOCKET)
    {
        // printf("accept failed with error code : %d" , WSAGetLastError());
        return 1;
    }

    closesocket(s);
    WSACleanup();

  #else

    TCPSocket* sock = new TCPSocket();
    #ifdef linux
    unsigned short port = static_cast<unsigned short>(std::atoi(port_arg.c_str()));
    #else
    unsigned short port = static_cast<unsigned short>(std::stoi(port_arg));
    #endif
    sock->Listen(port);

    Store store;

    while (1) {

      const unsigned int buffer_size = 1000 * 1024 * 1024;
      char* tcpbuffer = new char[buffer_size];
      unsigned int len = buffer_size;

      // // std::cout << "loop" << std::endl;

      TCPSocket* nsock = NULL;

      sock->Accept(&nsock);

      // std::cout<<"Accepted"<<std::endl;
      #ifdef linux
      if (nsock == NULL) {
        continue;
      }
      #else
      if (nsock == NULL) {
	       break;
      }
      #endif
      nsock->Read(tcpbuffer,&len);

      // std::cout<<"Ready"<<std::endl;

      if (strcmp(tcpbuffer,"") == 0) {
        // std::cout<<"Empty buffer"<<std::endl;
        continue;
      }

      // std::cout<<"Received "<<tcpbuffer<<std::endl;

      picojson::value v;
      std::string err = picojson::parse(v, tcpbuffer);

      if (! err.empty()) {
        std::cerr << err << std::endl;
      }

      if (! v.is<picojson::object>()) {
        continue;
      }

      picojson::object obj = v.get<picojson::object>();
      picojson::object out;
      BufferMapType bufferMap;

      std::string functionName = obj["function"].get<std::string>();
      picojson::object params = obj["parameters"].get<picojson::object>();

      // std::cout << functionName << std::endl;

      functors[functionName](store, params, out, bufferMap);

      picojson::object jsonObj;
      picojson::object offsets;

      // std::cout << "MAIN: BufferMapType" << std::endl;

      uint32_t data_size = 0;
      uint32_t offset = 0;
      for(BufferMapType::iterator it = bufferMap.begin(); it != bufferMap.end(); it++) {
        uint32_t size = (it->second).second.size();
        picojson::object offsetEntry;
        offsetEntry["type"] = picojson::value((it->second).first);
        offsetEntry["offset"] = picojson::value(static_cast<double>(offset));
        offsetEntry["length"] = picojson::value(static_cast<double>(size));
        offsets[it->first] = picojson::value(offsetEntry);
        uint32_t paddedSize = pad_size(size);
        data_size += paddedSize;
        offset += paddedSize;
      }

      jsonObj["arrays"] = picojson::value(offsets);
      jsonObj["data"] = picojson::value(out);

      // std::cout << "MAIN: json" << std::endl;

      std::string json = picojson::value(jsonObj).serialize();

      const unsigned int header_el_size = sizeof(uint32_t);

      uint32_t json_size = json.size();

      uint32_t hjson_size = 3*header_el_size + json_size;
      uint32_t padded_hjson_size = pad_size(hjson_size);
      unsigned int size = padded_hjson_size + data_size;

      std::vector<char> buffer(size);

      // std::cout << "MAIN: memcpy buffer" << std::endl;

      memcpy(buffer.data(), &size, header_el_size);
      memcpy(buffer.data() + header_el_size, &json_size, header_el_size);
      memcpy(buffer.data() + 2*header_el_size, &padded_hjson_size, header_el_size);
      memcpy(buffer.data() + 3*header_el_size, json.data(), json_size);

      offset = 0;

      // std::cout << "MAIN: BufferMap iterator" << std::endl;

      for(BufferMapType::iterator it = bufferMap.begin(); it != bufferMap.end(); it++) {
        uint32_t buffer_size = (it->second).second.size();
        memcpy(buffer.data() + padded_hjson_size + offset, (it->second).second.data(), buffer_size);
        offset += pad_size(buffer_size);
      }

      // std::cout << "MAIN: send" << std::endl;

      nsock->Send(buffer.data(), buffer.size());

      delete nsock;
      nsock = NULL;

      std::cout << "__done__" << std::endl;

      delete[] tcpbuffer;
    }

  #endif

  return 0;
}
