import os

with open("F:/xyh/anexacta/spolium/test_write.txt", "w", encoding="utf-8") as f:
    f.write("Works with <svg> & &amp; $variables @symbols")

print("Test write succeeded")
