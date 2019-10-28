cmake_minimum_required(VERSION 2.8)

project(cleanScene)

find_package(VTK REQUIRED)
include(${VTK_USE_FILE})

find_package(ITK REQUIRED)
include(${ITK_USE_FILE})


IF(${CMAKE_SYSTEM_NAME} MATCHES "Darwin")

    find_path(PICOJSON_DIRECTORY ${PICOJSON_DIRECTORY} osconfig.h)
    find_path(CRISSCROSSNET_DIRECTORY ${CRISSCROSSNET_DIRECTORY} include/crisscross/tcpsocket.h)
    find_path(VMTK_DIRECTORY ${VMTK_DIRECTORY} vmtk_env.sh)

    include_directories(${PICOJSON_DIRECTORY})
    include_directories(${CRISSCROSSNET_DIRECTORY}/include)
    include_directories(${VMTK_DIRECTORY}/include/vmtk)

    link_directories(${VMTK_DIRECTORY}/lib)
    FILE(GLOB vmtk ${VMTK_DIRECTORY}/lib/*.a)

    add_executable(scene scene.cpp)

    target_link_libraries(scene ${VTK_LIBRARIES} ${ITK_LIBRARIES} ${vmtk} )

ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Darwin")


IF(${CMAKE_SYSTEM_NAME} MATCHES "Linux")

    find_path(PICOJSON_DIRECTORY ${PICOJSON_DIRECTORY} osconfig.h)
    find_path(CRISSCROSSNET_DIRECTORY ${CRISSCROSSNET_DIRECTORY} include/crisscross/tcpsocket.h)
    find_path(VMTK_DIRECTORY ${VMTK_DIRECTORY} vmtk_env.sh)

    include_directories(${PICOJSON_DIRECTORY})
    include_directories(${CRISSCROSSNET_DIRECTORY}/include)
    include_directories(${VMTK_DIRECTORY}/include/vmtk)

    link_directories(${VMTK_DIRECTORY}/lib)
    FILE(GLOB vmtk ${VMTK_DIRECTORY}/lib/*.a)

    add_executable(scene scene.cpp)

    target_link_libraries(scene ${VTK_LIBRARIES} ${ITK_LIBRARIES} ${vmtk})

ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Linux")

IF(${CMAKE_SYSTEM_NAME} MATCHES "Windows")

    find_path(PICOJSON_DIRECTORY ${PICOJSON_DIRECTORY} osconfig.h)
    find_path(VMTK_DIRECTORY ${VMTK_DIRECTORY} vmtk_env.sh)

    include_directories(${PICOJSON_DIRECTORY})
    include_directories(${VMTK_DIRECTORY}/include/vmtk)

    link_directories(${VMTK_DIRECTORY}/lib)
    FILE(GLOB vmtk ${VMTK_DIRECTORY}/lib/*.lib)

    add_executable(scene scene.cpp)

    target_link_libraries(scene ${VTK_LIBRARIES} ${ITK_LIBRARIES} ${vmtk})

ENDIF(${CMAKE_SYSTEM_NAME} MATCHES "Windows")
