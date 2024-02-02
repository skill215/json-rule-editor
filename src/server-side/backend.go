package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v2"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"github.com/tidwall/gjson"
)

const deployedDir = "./rulesets-deployed"
const rulesetDir = "./rulesets"

type Config struct {
	Server struct {
		Port string `yaml:"port"`
		Host string `yaml:"host"`
	} `yaml:"server"`
	SMSC []struct {
		Hostname string `yaml:"hostname"`
		IP       string `yaml:"ip"`
		PORT     string `yaml:"port"`
	} `yaml:"smsc"`
}

type Response struct {
	Data string `json:"data"`
}

type JsonDeployResponse struct {
	Node   string `json:"node"`
	Result bool   `json:"result"`
	Info   string `json:"info"`
}

type InnerData struct {
	Success bool `json:"success"`
	Data    struct {
		Message string `json:"message"`
	} `json:"data"`
}

func readConfig() (*Config, error) {
	file, err := os.Open("rule-editor-server.yaml")

	if err != nil {
		return nil, err
	}
	defer file.Close()

	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, err
	}

	var config Config
	err = yaml.Unmarshal(bytes, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

func getIP() (string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String(), nil
			}
		}
	}

	return "", fmt.Errorf("no IP found")
}

func main() {
	config, err := readConfig()
	if err != nil {
		log.Fatalf("Error reading config: %v", err)
	}

	ownIP, err := getIP()
	if err != nil {
		log.Fatalf("Error getting own IP: %v", err)
	} else {
		log.Printf("Own IP: %s\n", ownIP)
	}

	r := mux.NewRouter()
	r.HandleFunc("/receive-validate", validate).Methods("POST")
	r.HandleFunc("/receive-ruleset", receiveRuleset).Methods("POST")
	r.HandleFunc("/fetch-ruleset-from-frontend", fetchRulesetFrontend).Methods("GET")
	r.HandleFunc("/delete-ruleset", deleteRuleset).Methods("POST") // New route
	r.HandleFunc("/receive-deploy-ruleset", receiveDeployRuleset).Methods("POST")
	r.HandleFunc("/fetch-rulesets-from-client", fetchRulesetsClient).Methods("GET")

	handler := cors.Default().Handler(r)

	http.ListenAndServe(":"+config.Server.Port, handler)
}

func validate(w http.ResponseWriter, r *http.Request) {
	log.Println("Starting validation")

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Println("Error reading request body:", err)
		httpError(w, "Error reading request body", err)
		return
	}

	if err := writeToFile(body); err != nil {
		log.Println("Error writing file:", err)
		httpError(w, "Error writing file", err)
		return
	}

	respBody, err := performValidation(body)
	if err != nil {
		log.Println("Error performing validation:", err)
		httpError(w, "Error performing validation", err)
		return
	}

	log.Println("Validation successful, response body:", respBody)

	var response Response
	err = json.Unmarshal([]byte(respBody), &response)
	if err != nil {
		log.Fatal(err)
	}

	var innerData InnerData
	err = json.Unmarshal([]byte(response.Data), &innerData)
	if err != nil {
		log.Fatal(err)
	}

	// Write the innerData as a JSON string to the dataString
	err = json.NewEncoder(w).Encode(innerData)
	if err != nil {
		log.Fatal(err)
	}

	//fmt.Fprint(w, dataString)
}

func writeToFile(body []byte) error {
	name := gjson.Get(string(body), "ruleset.name").String()
	dir := "./validate"

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.Mkdir(dir, 0755)
	}

	filePath := filepath.Join(dir, fmt.Sprintf("%s-v.json", name))
	log.Println("Writing to file:", filePath)
	return ioutil.WriteFile(filePath, body, 0644)
}

func performValidation(body []byte) (string, error) {
	log.Println("Performing validation")

	config, err := readConfig()
	if err != nil {
		log.Println("Error reading config:", err)
		return "", err
	}

	if len(config.SMSC) == 0 {
		log.Println("No SMSC configuration found")
		return "", errors.New("no SMSC configuration found")
	}

	validationURL := "http://" + config.SMSC[0].IP + ":" + config.SMSC[0].PORT + "/validate"
	log.Println("Validation URL:", validationURL)

	req, err := http.NewRequest("POST", validationURL, bytes.NewBuffer(body))
	if err != nil {
		log.Println("Error creating request:", err)
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	log.Println("Req length:", len(body))
	log.Println("Request:", req)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error making request:", err)
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Println("Error in response from external API, status code:", resp.StatusCode)
		return "", errors.New("error in response from external API")
	}

	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Println("Error reading response body:", err)
		return "", err
	}

	return string(respBody), nil
}

func httpError(w http.ResponseWriter, message string, err error) {
	log.Println("Sending HTTP error:", message, err)
	http.Error(w, fmt.Sprintf("%s: %v", message, err), http.StatusInternalServerError)
}
func receiveRuleset(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body",
			http.StatusInternalServerError)
		return
	}

	dir := rulesetDir
	err = saveRulesetToFile(body, dir)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error saving ruleset to file: %v", err),
			http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, `{"message": "ruleset received and saved to file"}`)
}

func saveRulesetToFile(body []byte, dir string) error {
	if dir == "" {
		return errors.New("invalid directory")
	}

	name := gjson.Get(string(body), "name").String()

	log.Println("Saving ruleset to file:", name)

	if _, err := os.Stat(dir); os.IsNotExist(err) {
		err = os.Mkdir(dir, 0755)
		if err != nil {
			return err
		}
	}

	filePath := filepath.Join(dir, fmt.Sprintf("%s.json", name))
	err := ioutil.WriteFile(filePath, body, 0644)
	if err != nil {
		return err
	}
	log.Println("Ruleset saved to file:", filePath)
	return nil
}

func receiveDeployRuleset(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}
	log.Println("Request body read successfully in receiveDeployRuleset: ", string(body))

	ruleset := gjson.Get(string(body), "ruleset").String()
	log.Println("Ruleset: ", ruleset)

	// Call activateRuleset next
	activateRuleset(w, []byte(ruleset))
}

func distributeServerInfo(smsc struct {
	Hostname string `yaml:"hostname"`
	IP       string `yaml:"ip"`
	PORT     string `yaml:"port"`
}, serverInfo struct {
	Port string `yaml:"port"`
	Host string `yaml:"host"`
}) bool {
	serverInfoURL := "http://" + smsc.IP + ":" + smsc.PORT + "/serverInfo"
	if serverInfo.Host == "localhost" {
		serverInfo.Host, _ = getIP()
		log.Printf("Server host set to %s\n", serverInfo.Host)
	}
	serverInfoJSON, err := json.Marshal(serverInfo)
	if err != nil {
		log.Println("Error marshaling server info:", err)
		return false
	}
	log.Println("Server info JSON:", string(serverInfoJSON))

	req, err := http.NewRequest("POST", serverInfoURL, bytes.NewBuffer(serverInfoJSON))
	if err != nil {
		log.Println("Error creating request:", err)
		return false
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: time.Second * 1,
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error making request:", err)
		return false
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Println("Error in response from external API, status code:", resp.StatusCode)
		return false
	}

	return true
}

func activateRuleset(w http.ResponseWriter, body []byte) {
	log.Println("Activating ruleset")

	config, err := readConfig()
	if err != nil {
		log.Println("Error reading config:", err)
		httpError(w, "Error reading config", err)
		return
	}
	log.Println("Config read successfully")

	if len(config.SMSC) == 0 {
		log.Println("No SMSC configuration found")
		httpError(w, "No SMSC configuration found", nil)
		return
	}
	log.Println("SMSC configuration found")

	var results []JsonDeployResponse

	for _, smsc := range config.SMSC {
		log.Println("Processing SMSC:", smsc.Hostname)
		result := JsonDeployResponse{Node: smsc.Hostname, Result: false, Info: "No response received"}

		// Distribute server info
		serverInfo := config.Server
		success := distributeServerInfo(smsc, serverInfo)
		if !success {
			log.Println("Error distributing server info to", smsc.Hostname)
			result.Info = fmt.Sprintf("Server %s is unreachable", smsc.Hostname)
			results = append(results, result)
			continue
		}

		deployURL := "http://" + smsc.IP + ":" + smsc.PORT + "/deploy"
		log.Println("Deploy URL:", deployURL)

		req, err := http.NewRequest("POST", deployURL, bytes.NewBuffer(body))
		if err != nil {
			log.Println("Error creating request:", err)
			result.Info = fmt.Sprintf("Error creating request to %s: %v", smsc.Hostname, err)
		} else {
			req.Header.Set("Content-Type", "application/json")
			log.Println("Request created successfully")

			client := &http.Client{
				Timeout: time.Second * 5,
			}
			resp, err := client.Do(req)
			if err != nil {
				log.Println("Error making request:", err)
				result.Info = fmt.Sprintf("Error making request to %s: %v", smsc.Hostname, err)
			} else {
				defer resp.Body.Close()
				log.Println("Request made successfully")

				if resp.StatusCode != http.StatusOK {
					log.Println("Error in response from external API, status code:", resp.StatusCode)
					result.Info = fmt.Sprintf("Error in response from %s, status code: %d", smsc.Hostname, resp.StatusCode)
				} else {
					log.Println("Response received successfully")

					respBody, err := ioutil.ReadAll(resp.Body)
					if err != nil {
						log.Println("Error reading response body:", err)
						result.Info = fmt.Sprintf("Error reading response body from %s: %v", smsc.Hostname, err)
					} else {
						log.Println("Response body read successfully")

						result.Info = string(respBody)
						log.Println("Response body: ", string(respBody))
						result.Result = true
					}
				}
			}
		}
		results = append(results, result)
	}

	anySuccess := false
	for _, result := range results {
		if result.Result {
			anySuccess = true
			break
		}
	}

	// Save the ruleset to deployedDir if any SMSC was successfully deployed to
	if anySuccess {
		err = saveRulesetToFile([]byte(body), deployedDir)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error saving ruleset to file: %v", err), http.StatusInternalServerError)
			return
		}
	}

	err = json.NewEncoder(w).Encode(results)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resultsJSON, err := json.Marshal(results)
	if err != nil {
		log.Println("Error converting results to JSON:", err)
	} else {
		log.Println("Results:", string(resultsJSON))
	}
}

func deleteRuleset(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading request body: %v\n", err) // Debug info
		http.Error(w, "Error reading request body",
			http.StatusInternalServerError)
		return
	}

	name := gjson.Get(string(body), "name").String()
	log.Printf("Deleting ruleset: %s\n", name) // Debug info

	dir := rulesetDir
	filePath := filepath.Join(dir, fmt.Sprintf("%s.json", name))

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Printf("File %s does not exist\n", filePath) // Debug info
		http.Error(w, fmt.Sprintf("File %s does not exist", filePath),
			http.StatusNotFound)
		return
	}

	err = os.Remove(filePath)
	if err != nil {
		log.Printf("Error deleting file %s: %v\n", filePath, err) // Debug info
		http.Error(w, fmt.Sprintf("Error deleting file %s", filePath),
			http.StatusInternalServerError)
		return
	}

	log.Printf("File %s deleted successfully\n", filePath) // Debug info
	fmt.Fprintf(w, `{"message": "ruleset %s deleted"}`, name)
}
func fetchRulesetFrontend(w http.ResponseWriter, r *http.Request) {
	dir := rulesetDir

	results, err := readRuleFiles(dir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResults, err := json.Marshal(results)
	if err != nil {
		http.Error(w, "Error converting results to JSON",
			http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResults)
}

func readRuleFiles(dir string) ([]map[string]interface{}, error) {
	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var results []map[string]interface{}
	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" && file.Name() != ".json" {
			content, err := ioutil.ReadFile(filepath.Join(dir, file.Name()))
			if err != nil {
				return nil, fmt.Errorf("error reading file %s: %v", file.Name(), err)
			}

			var result map[string]interface{}
			if err := json.Unmarshal(content, &result); err != nil {
				return nil, fmt.Errorf("error parsing JSON in file %s: %v", file.Name(), err)
			}

			results = append(results, result)
		}
	}

	return results, nil
}

func fetchRulesetsClient(w http.ResponseWriter, r *http.Request) {
	dir := deployedDir

	results, err := readRuleFiles(dir)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	jsonResults, err := json.Marshal(results)
	if err != nil {
		http.Error(w, "Error converting results to JSON",
			http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResults)
	log.Printf("Rulesets sent to client successfully\n")
}
