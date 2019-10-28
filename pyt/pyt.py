import sys

print sys.argv

a = 3
b = 5
print a,b

s = 'string'

print s

# while True:
#     print 'ciao'

print 'te\nme'

print '''ciao
ciao
ciao '''

print 'ciao ' *3

word = 'boooobs'

print word[0], word[-1]
print word[2:5]
print word, len(word)

# NOTE:
# arrays are immutable
# lists are mutable

numbers = [1,2,5,4,3,5,6,3]
numbers.append(0)
numbers.append(3*2)
numbers[0:3] = [0,0,0,0]
numbers[2] = [3,3]
numbers[3] = 'mmm'
print numbers
print numbers[2][1]

# assegnamenti multipli
a,b = 1,0
print a,b
a,b = b,b
print a,b

# sostituire il newline (python 3?)
# print a, end='--'

# command line input request
x = int(input("enter number: "))
print x

# if
if x<0:
    print 1
elif x==0:
    print 9
else :
    print 'c'

# for (use [:] to make a copy of list if modifying it in the loop)
for n in numbers[:] :
    numbers.append(1)
    print n

print numbers

for i in range(5): # or range(5,10) or range(0,10,3)<step
    numbers.append(3)

# iterate over a list
for i in range(len(numbers)):
    print i, numbers[i]

# list() creates lists from iterabeles objects
print list(range(5))

for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(n, 'equals', x, '*', n//x) # divisione intera
            break
    else:
        # loop fell through without finding a factor (like a try...else..)
        print(n, 'is a prime number')

pass # do nothing! ahah

# FUNCTIONS

def lol(ar): # args MUST be passed
    'docstring'
    print 'looool'
    return ar

res = lol(sys.argv[1])
print 'res', res
