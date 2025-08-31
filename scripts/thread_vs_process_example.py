import sys
import os
import threading
import multiprocessing

NUM_THREADS = 4
NUM_PROCESSES = 4

global_x = 5

global_y = 10

global_z = 15


def get_pid_and_tid():
    return os.getpid(), threading.get_native_id()


def increment_x_and_print():
    global global_x

    pid, tid = get_pid_and_tid()

    print(f"PID: {pid}, TID: {tid}, x Before: {global_x}")
    global_x += 1
    print(f"PID: {pid}, TID: {tid}, x After: {global_x}")


if __name__ == "__main__":
    if sys.argv[1] == "t":
        num_to_use = NUM_THREADS if len(sys.argv) == 2 else int(sys.argv[2])
        parent_pid, parent_tid = get_pid_and_tid()
        print(f"Parent PID: {parent_pid}, Parent TID: {parent_tid}")
        print(f"Parent x: {global_x}")

        threads = []
        for i in range(num_to_use - 1):
            thread = threading.Thread(target=increment_x_and_print)
            threads.append(thread)
            thread.start()

        increment_x_and_print()

        for thread in threads:
            thread.join()

    else:
        assert sys.argv[1] == "p"
        num_to_use = NUM_PROCESSES if len(sys.argv) == 2 else int(sys.argv[2])
        parent_pid, parent_tid = get_pid_and_tid()
        print(f"Parent PID: {parent_pid}, Parent TID: {parent_tid}")
        print(f"Parent x: {global_x}")

        processes = []
        for i in range(num_to_use - 1):
            process = multiprocessing.Process(target=increment_x_and_print)
            processes.append(process)
            process.start()

        increment_x_and_print()

        for process in processes:
            process.join()