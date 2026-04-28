#include <stdio.h>
#include <x86intrin.h> // Required for hardware instructions like _mm_clflush
#include <unistd.h>

unsigned char shared_array[256 * 4096];

int main() {
    printf("Attacker (Cache Flusher) is running... PID: %d\n", getpid());
    
    while (1) {
        // Aggressively flush memory addresses from the CPU cache
        for (int i = 0; i < 256; i++) {
            _mm_clflush(&shared_array[i * 4096]);
        }
        // High frequency to generate significant cache-miss noise
        usleep(500); 
    }
    return 0;
}
