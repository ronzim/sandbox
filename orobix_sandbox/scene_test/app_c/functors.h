#ifndef __functors__h__
#define __functors__h__

#include "picojson.h"

#include <sstream>

class Store
{
public:

  template <typename T>
  T get(const std::string& uuid)
  {
    StoreMapIterator it = _storeMap.find(uuid);
    if (it == _storeMap.end()) {
      return NULL;
    }
    return static_cast<T>(it->second);
  }

  void set(const std::string& uuid, void* data)
  {
    _storeMap[uuid] = data;
  }

  std::string insert(const std::string _uuid, void* data)
  {
    std::stringstream ss;
    ss << _uuid;
    this->set(ss.str(),data);
    return ss.str();
  }

  void remove(const std::string& uuid)
  {
    _storeMap.erase(uuid);
  }

private:
  typedef std::map<std::string, void*> StoreMapType;
  typedef StoreMapType::iterator StoreMapIterator;
  StoreMapType _storeMap;
};

typedef std::pair< std::string, std::vector<char> > BufferPairType;
typedef std::map<std::string, BufferPairType> BufferMapType;

struct Functor
{
  virtual void operator()(Store& store,
                          picojson::object& params,
                          picojson::object& out,
                          BufferMapType& bufferMap) const = 0;
  virtual ~Functor() {};
};


class Functors
{
public:
  template <typename T>
  void registerFunctor(const std::string& functionName)
  {
    Functor* functor = new T();
    _functorsMap[functionName] = functor;
  }

  void unregisterFunctor(const std::string& functionName)
  {
    Functor* functor = _functorsMap[functionName];
    delete functor;
    _functorsMap.erase(functionName);
  }

  const Functor& operator[](const std::string& functionName)
  {
    FunctorsMapIterator it = _functorsMap.find(functionName);
    if (it == _functorsMap.end()) {
      throw std::out_of_range("No functor found");
    }
    return *(it->second);
  }

  virtual ~Functors()
  {
    FunctorsMapIterator it;
    for (it = _functorsMap.begin(); it != _functorsMap.end(); ++it)
    {
      delete it->second;
    }
  }

private:
  typedef std::map<std::string, Functor*> FunctorsMapType;
  typedef FunctorsMapType::iterator FunctorsMapIterator;
  FunctorsMapType _functorsMap;
};

#endif
