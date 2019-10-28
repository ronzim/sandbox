file(REMOVE_RECURSE
  "opera.pdb"
  "opera"
)

# Per-language clean rules from dependency scanning.
foreach(lang )
  include(CMakeFiles/opera.dir/cmake_clean_${lang}.cmake OPTIONAL)
endforeach()
