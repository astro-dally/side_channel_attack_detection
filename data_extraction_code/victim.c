#include <stdio.h>
#include <string.h>
#include <unistd.h>

char secret[] = "THIS_IS_MY_DUMMY_SECRET";
unsigned char probe_array[256 * 4096]; // 256 memory pages

int main() {
    int i = 0;
    printf("Victim is running... PID: %d\n", getpid());
    
    while (1) {
        // Accessing the array based on the ASCII value of the secret's characters
        // This is what an attacker tries to measure via the cache
        volatile unsigned char dummy = probe_array[secret[i % strlen(secret)] * 4096];
        i++;
        
        // Small delay to prevent locking up your whole CPU
        usleep(1000); 
    }
    return 0;
}
